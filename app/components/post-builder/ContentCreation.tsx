import { Button } from '@/components/ui/button';
import { MenuBar } from '@/components/rich-text-editor/MenuBar';
import type { Editor } from '@tiptap/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePostBuilder, { type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { CheckIcon, Copy, ExternalLink, Loader2, LockIcon, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { useParams } from 'react-router';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { unpublishPost, updatePublishedPost } from '@/services/client/post.client';
import DialogConfirmUnpublish from '@/components/preview/common/DialogConfirmUnpublish';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { estimateCoinCost, type CoinCostQuote } from '@/services/client/coin-pricing.client';
import { useUserStore } from '@/store/user.store';
import { useOptimisticCoinDebit } from '@/hooks/useOptimisticCoinDebit';
import { toast } from 'sonner';
import { ALL_PLATFORMS, buildCaptionPayloads, applyCaptionResults, loadSavedCaptions } from './common/caption-utils';
import { PlatformPicker } from './common/PlatformPicker';
import { getCaptionLimits } from '@/routes/post-builder/hooks/platform-char-limits';
import { normalizePostType } from '@/routes/post-builder/hooks/publish-utils';
import { cn } from '@/lib/utils';
import PublishedAnalytics from './PublishedAnalytics';
import { useRefetchUser } from '@/utils/user-state';

type CaptionLanguage = 'en' | 'vi';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatePlatforms, setGeneratePlatforms] = useState<Set<PostBuilderPlatform>>(new Set(ALL_PLATFORMS));
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [captionCostQuote, setCaptionCostQuote] = useState<CoinCostQuote | null>(null);
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);
  // Caption-generation language — sent to the BE's `language` param which normalizes
  // `vi` → Vietnamese and `en` → English before feeding the prompt.
  const [captionLanguage, setCaptionLanguage] = useState<CaptionLanguage>('en');

  // Coin debit hook for optimistic updates
  const { onMutate: debitCoins, onError: rollbackCoins } = useOptimisticCoinDebit();

  const setCaptionGenerating = usePostBuilder((state) => state.setCaptionGenerating);
  const refetchUser = useRefetchUser();
  const isCaptionGenerating = usePostBuilder((state) => state.isCaptionGenerating);
  const copyResetTimerRef = useRef<number | null>(null);
  const setRawContent = usePostBuilder((state) => state.setRawContent);
  const setPlatformContent = usePostBuilder((state) => state.setPlatformContent);
  const activePlatform = usePostBuilder((state) => state.activePlatform);
  const platformContents = usePostBuilder((state) => state.platformContents);
  const platformModes = usePostBuilder((state) => state.platformModes);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const content = usePostBuilder((state) => state.content);
  const activeMode = usePostBuilder((state) => state.platformModes[state.activePlatform]);
  const platformPublishStates = usePostBuilder((state) => state.platformPublishStates);
  const activePublishState = usePostBuilder(
    (state) => state.platformPublishStates[state.activePlatform]?.[state.platformModes[state.activePlatform]]
  );
  const isActivePublished = activePublishState?.isPublished === true;

  // A platform is "locked for generation" when the current mode on that platform is
  // already published OR actively publishing — generating a new caption there would
  // either fail (editor is locked) or stomp on the live copy.
  const lockedForGeneration = useMemo(() => {
    const locked = new Set<PostBuilderPlatform>();
    for (const p of ALL_PLATFORMS) {
      const mode = platformModes[p];
      const info = platformPublishStates[p]?.[mode];
      if (info?.status === 'published' || info?.status === 'publishing' || info?.status === 'unpublishing') {
        locked.add(p);
      }
    }
    return locked;
  }, [platformModes, platformPublishStates]);

  // Pixtral needs images/videos to ground its captions. A platform with no media in its
  // active mode has nothing to show to the model — exclude it from the picker AND drop
  // it from the `generatePlatforms` set so the cost estimate + button label reflect what
  // will actually be sent to the BE.
  const platformsWithoutMedia = useMemo(() => {
    const empty = new Set<PostBuilderPlatform>();
    for (const p of ALL_PLATFORMS) {
      const mode = platformModes[p];
      const ids = previewStates[p]?.selectedMediaIds?.[mode] ?? [];
      if (ids.length === 0) empty.add(p);
    }
    return empty;
  }, [platformModes, previewStates]);

  // Merge both gating sets so the picker shows the same disabled UI for either reason.
  const pickerDisabledPlatforms = useMemo(() => {
    const set = new Set<PostBuilderPlatform>(lockedForGeneration);
    for (const p of platformsWithoutMedia) set.add(p);
    return set;
  }, [lockedForGeneration, platformsWithoutMedia]);
  const isActivePublishing = activePublishState?.status === 'publishing';
  const isActiveUnpublishing = activePublishState?.status === 'unpublishing';
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmittingUnpublish, setIsSubmittingUnpublish] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
  const isActiveLocked = (isActivePublished || isActivePublishing || isActiveUnpublishing) && !isEditMode;
  const lastEditorHtmlRef = useRef('');

  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id,
    refetchOnMount: 'always'
  });

  const programmaticSetRef = useRef(false);
  const editorInteractiveRef = useRef(false);

  const handleContentChange = (currentEditor: Editor) => {
    if (programmaticSetRef.current) return;
    // Until the editor view has received a user-initiated focus/key event, all
    // onUpdate emissions are TipTap's internal noise (initial mount, setEditable
    // toggles, etc.) and must not be written back to the store.
    if (!editorInteractiveRef.current) return;
    const text = currentEditor.getText().trim();
    const htmlContent = currentEditor.getHTML();
    lastEditorHtmlRef.current = htmlContent;
    setRawContent({ content: text, htmlContent });
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    // Block typing while a generation request is in-flight — the BE response lands after
    // the await resolves and calls setPlatformContent, so letting the user type in the
    // meantime means their edits get clobbered by the generated caption.
    editable: !isActiveLocked && !isCaptionGenerating,
    onUpdate: ({ editor: currentEditor }: { editor: Editor }) => {
      handleContentChange(currentEditor);
    }
  });

  // Flip the interactive flag on the first real user event on the editor DOM,
  // so phantom onUpdate emissions from setContent / setEditable / re-mounts
  // can't overwrite the store before the user has actually typed anything.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const markInteractive = () => {
      if (!editorInteractiveRef.current) {
        editorInteractiveRef.current = true;
      }
    };
    dom.addEventListener('keydown', markInteractive);
    dom.addEventListener('paste', markInteractive);
    dom.addEventListener('input', markInteractive);
    return () => {
      dom.removeEventListener('keydown', markInteractive);
      dom.removeEventListener('paste', markInteractive);
      dom.removeEventListener('input', markInteractive);
    };
  }, [editor]);

  // When the active (platform, mode) switches, reset the interactive flag so
  // the newly-loaded caption can't be clobbered by a leftover "user" state
  // from the previous bucket. Also exit edit mode — edit is scoped to one bucket.
  useEffect(() => {
    editorInteractiveRef.current = false;
    setIsEditMode(false);
  }, [activePlatform, activeMode]);

  const requestUnpublish = () => {
    setIsUnpublishConfirmOpen(true);
  };

  const handleUnpublish = async () => {
    if (!id) return;
    setIsUnpublishConfirmOpen(false);
    setIsSubmittingUnpublish(true);
    try {
      // Find the post id on BE for this (platform, mode). FB/IG split into (platform, posts)
      // and (platform, reels) groups — we MUST match by type, otherwise unpublishing the post
      // mode could resolve to the reel's post id and vice-versa, hitting Post.NoActivePublications.
      const groups = postBuilderData?.value?.socialMedia ?? [];
      const dbPlatform = activePlatform === 'thread' ? 'threads' : activePlatform;
      const dbType = normalizePostType(activeMode);
      const group = groups.find((g) => {
        const p = g.platform?.toLowerCase();
        const matchesPlatform = p === dbPlatform || (dbPlatform === 'instagram' && p === 'ig');
        if (!matchesPlatform) return false;
        if (activePlatform === 'facebook' || activePlatform === 'instagram') {
          // normalizePostType handles legacy singular "post"/"reel" and null post_type so
          // Facebook/Instagram groups with old-schema data still match their FE mode.
          return normalizePostType(g.type) === dbType;
        }
        return true;
      });
      const targetPostId = group?.posts?.find((p) => p.isPublished)?.id ?? group?.posts?.[0]?.id;
      if (!targetPostId) {
        toast.error('No published post found for this platform.');
        return;
      }
      await unpublishPost(targetPostId);
      // Start toast suppressed — the orange "Unpublishing…" banner on the builder is enough
      // signal; the single batch-completed toast fires from the notification hub at the end.
      void queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unpublish failed';
      toast.error(msg);
    } finally {
      setIsSubmittingUnpublish(false);
    }
  };

  const handleSaveCaptionEdit = async () => {
    if (!id) return;
    const currentText = platformContents[activePlatform]?.[activeMode]?.text ?? '';
    if (!currentText.trim()) {
      toast.error('Caption cannot be empty.');
      return;
    }
    setIsSubmittingUpdate(true);
    try {
      const groups = postBuilderData?.value?.socialMedia ?? [];
      const dbPlatform = activePlatform === 'thread' ? 'threads' : activePlatform;
      const dbType = normalizePostType(activeMode);
      const group = groups.find((g) => {
        const p = g.platform?.toLowerCase();
        const matchesPlatform = p === dbPlatform || (dbPlatform === 'instagram' && p === 'ig');
        if (!matchesPlatform) return false;
        if (activePlatform === 'facebook' || activePlatform === 'instagram') {
          // normalizePostType handles legacy singular "post"/"reel" and null post_type so
          // Facebook/Instagram groups with old-schema data still match their FE mode.
          return normalizePostType(g.type) === dbType;
        }
        return true;
      });
      const targetPostId = group?.posts?.find((p) => p.isPublished)?.id ?? group?.posts?.[0]?.id;
      if (!targetPostId) {
        toast.error('No published post found for this platform.');
        return;
      }
      await updatePublishedPost(targetPostId, { content: currentText, hashtag: null });
      // Start toast suppressed — the notification hub's batch-completed toast + banner update
      // cover the user feedback path.
      setIsEditMode(false);
      void queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error(msg);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isActiveLocked && !isCaptionGenerating);
  }, [editor, isActiveLocked, isCaptionGenerating]);

  const handleCopyContent = async () => {
    const text = platformContents[activePlatform]?.[activeMode]?.text ?? '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const toggleGeneratePlatform = (platform: PostBuilderPlatform) => {
    // Block manual toggles on either lock reason so the user can't sneak an empty /
    // already-published platform back into the generate set after auto-drop.
    if (pickerDisabledPlatforms.has(platform)) return;
    setGeneratePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  // Auto-drop disabled platforms from the generate set:
  //   - locked (already-published / in-flight) → can't regenerate on top of live copy
  //   - missing media → Pixtral has no image to read; BE would reject anyway
  // Both re-add naturally when the user picks media / unpublishes.
  useEffect(() => {
    setGeneratePlatforms((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const p of pickerDisabledPlatforms) {
        if (next.delete(p)) changed = true;
      }
      return changed ? next : prev;
    });
  }, [pickerDisabledPlatforms]);

  const handleGenerate = async () => {
    if (!postBuilderData?.value) {
      toast.error('Post builder data not loaded');
      return;
    }

    setIsGenerating(true);
    // Flip the store flag so PostBuilderHeader's Publish / Save Draft go disabled until
    // the generated captions have landed in `platformContents`.
    setCaptionGenerating(true);

    // Optimistic debit coins from store
    const cost = captionCostQuote?.totalCoins ?? 0;
    const context = debitCoins(cost);

    try {
      const entries = buildCaptionPayloads(postBuilderData.value, generatePlatforms, platformModes, previewStates);

      if (entries.length === 0) {
        rollbackCoins(context);
        toast.error('No platforms with resources available to generate captions');
        setIsGenerating(false);
        return;
      }

      const response = await PostPrepareClientApi.createPostCaption({
        language: captionLanguage,
        instruction: content || null,
        socialMedia: entries.map((e) => e.payload)
      });

      if (!response.isSuccess || !response.value) {
        throw new Error(response.error?.description || 'Failed to generate captions');
      }

      const savePromises = applyCaptionResults(response.value.socialMedia, entries, setPlatformContent);
      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
      // Refetch user profile to reconcile coin balance
      void refetchUser();
      setHasGenerated(true);
      toast.success('Captions generated successfully');
    } catch (err) {
      // Rollback optimistic debit on error
      rollbackCoins(context);

      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message.includes('Billing.InsufficientFunds') || message.toLowerCase().includes('insufficient')) {
        setIsInsufficientOpen(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsGenerating(false);
      setCaptionGenerating(false);
    }
  };

  // Cost estimate for the caption Generate button. Scales with the number of platforms
  // the user has selected in the PlatformPicker — empty selection → 0 coins.
  useEffect(() => {
    const controller = new AbortController();
    const quantity = generatePlatforms.size;
    if (quantity <= 0) {
      setCaptionCostQuote(null);
      return () => controller.abort();
    }
    (async () => {
      try {
        const res = await estimateCoinCost(
          {
            actionType: 'caption_generation',
            model: 'pixtral-12b-2409',
            variant: null,
            quantity
          },
          controller.signal
        );
        if (res.isSuccess) setCaptionCostQuote(res.value);
      } catch {
        /* non-fatal — button just shows plain label */
      }
    })();
    return () => controller.abort();
  }, [generatePlatforms]);

  // Seed saved captions ONLY on the first successful data arrival per mount. Subsequent
  // refetches (triggered by Save Draft's `invalidateQueries`, publish-flow SignalR
  // notifications, etc.) must NOT re-run loadSavedCaptions — the FE is already the
  // source of truth for anything the user has typed.
  //
  // Why: loadSavedCaptions rebuilds HTML via `textToHtml(caption)` which wraps every
  // line in `<p>` tags from scratch. Even when BE and FE hold identical text, the
  // re-wrapped HTML differs from the editor's live HTML, so the editor-sync effect
  // fires `editor.commands.setContent(nextHtml)` and clobbers the user's edit. Since
  // the component unmounts + remounts when switching to a different builder, the ref
  // resets naturally for the next post-builder's initial seed.
  const hasSeededCaptionsRef = useRef(false);
  useEffect(() => {
    if (!postBuilderData?.value) return;
    if (hasSeededCaptionsRef.current) return;
    const hasContent = loadSavedCaptions(postBuilderData.value, setPlatformContent);
    if (hasContent) setHasGenerated(true);
    hasSeededCaptionsRef.current = true;
  }, [postBuilderData, setPlatformContent]);

  // Per-(platform, mode) caption limits used for the inline counter + soft-cap at the
  // platform's recommended length. Hard `max` is the API ceiling (Threads 500, Meta/
  // TikTok 2200). Guidance below 300 warns the user's text exceeds what the platform
  // typically renders inline.
  const captionLimits = useMemo(() => getCaptionLimits(activePlatform, activeMode), [activePlatform, activeMode]);
  const activeCaptionLength = useMemo(
    () => (platformContents[activePlatform]?.[activeMode]?.text ?? '').length,
    [platformContents, activePlatform, activeMode]
  );
  const isOverMax = activeCaptionLength > captionLimits.max;
  const isOverRecommended = activeCaptionLength > captionLimits.recommended;

  // Sync editor content when the active (platform, mode) bucket changes.
  // Only skip when (a) both sides agree on "empty", or (b) editor already shows the same
  // HTML. We deliberately do NOT bail on lastEditorHtmlRef equality because a previous
  // non-matching user edit can leave that ref stale and block a legitimate sync-from-store.
  useEffect(() => {
    if (!editor) return;

    const bucket = platformContents[activePlatform]?.[activeMode];
    const nextHtml = bucket?.html || '';
    const currentHtml = editor.getHTML();
    const isNextEmpty = nextHtml.trim() === '';
    const isCurrentEmpty = currentHtml === '<p></p>' || currentHtml.trim() === '';

    if ((isNextEmpty && isCurrentEmpty) || currentHtml === nextHtml) {
      return;
    }

    // TipTap can emit an update event after setContent via a deferred transaction, so
    // gate handleContentChange with a ref + 50ms window.
    programmaticSetRef.current = true;
    editor.commands.setContent(nextHtml, false);
    lastEditorHtmlRef.current = nextHtml;
    const timer = window.setTimeout(() => {
      programmaticSetRef.current = false;
    }, 50);
    return () => {
      window.clearTimeout(timer);
      programmaticSetRef.current = false;
    };
  }, [activePlatform, activeMode, editor, platformContents]);

  // Cleanup copy timer
  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const generateLabel = useMemo(() => {
    if (isGenerating) return 'Generating...';
    const base = hasGenerated ? 'Regenerate' : 'Generate';
    const cost = captionCostQuote?.totalCoins ?? 0;
    return cost > 0 ? `${base} · ${cost} coins` : base;
  }, [hasGenerated, isGenerating, captionCostQuote]);

  const currentBalance = useUserStore((s) => Number(s.user?.meAiCoin ?? 0));

  return (
    <div className='rounded-2xl border border-white/10 bg-zinc-950'>
      <div className='border-b border-white/10 px-6 py-4'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-white'>Content Creation</h2>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleCopyContent}
            className='border border-white/10 text-zinc-200 hover:bg-white/10 hover:text-white'
          >
            {copied ? (
              <>
                <CheckIcon className='size-4' /> Copied
              </>
            ) : (
              <>
                <Copy className='size-4' /> Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <div className='space-y-5 p-6'>
        {isActivePublishing && (
          <div className='flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200'>
            <RotateCw className='size-4 animate-spin' />
            <span>
              <span className='capitalize'>{activePlatform}</span>{' '}
              <span className='uppercase text-xs'>{activeMode}</span> is publishing — editing is locked until all
              targets finish.
            </span>
          </div>
        )}

        {isActiveUnpublishing && (
          <div className='flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200'>
            <RotateCw className='size-4 animate-spin' />
            <span>
              <span className='capitalize'>{activePlatform}</span>{' '}
              <span className='uppercase text-xs'>{activeMode}</span> is being removed from the platform — you'll get a
              notification when it's back to draft.
            </span>
          </div>
        )}

        {isActivePublished && !isActiveUnpublishing && !isEditMode && (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>
            <div className='flex items-center gap-2'>
              <LockIcon className='size-4' />
              <span>
                <span className='capitalize'>{activePlatform}</span>{' '}
                <span className='uppercase text-xs'>{activeMode}</span> is published.
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {activePublishState?.externalUrl ? (
                <a
                  href={activePublishState.externalUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25'
                >
                  <ExternalLink className='size-3.5' /> View on {activePlatform}
                </a>
              ) : null}
              {/* Only Facebook's Graph API supports editing a published post. Instagram,
                  Threads, and TikTok all reject the update and require unpublish + repost
                  (see UpdatePublishedTargetConsumer.cs — those platforms return
                  `{Platform}.UpdateNotSupported`). Hiding the button avoids a silent failure. */}
              {activePlatform === 'facebook' && (
                <button
                  type='button'
                  disabled={isGenerating}
                  onClick={() => {
                    editorInteractiveRef.current = true;
                    setIsEditMode(true);
                  }}
                  className='inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60'
                  title={isGenerating ? 'Wait for caption generation to finish' : undefined}
                >
                  <Pencil className='size-3.5' /> Edit caption
                </button>
              )}
              <button
                type='button'
                onClick={requestUnpublish}
                disabled={isSubmittingUnpublish || isGenerating}
                className='inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/25 disabled:opacity-60'
                title={isGenerating ? 'Wait for caption generation to finish' : undefined}
              >
                {isSubmittingUnpublish ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <Trash2 className='size-3.5' />
                )}
                Unpublish
              </button>
            </div>
          </div>
        )}

        {/* Analytics card — only when the active bucket is live AND we have the ids the
            analytics endpoint needs. Hidden during unpublish/edit so it doesn't stack
            with those banners in the middle of a state change. */}
        {isActivePublished &&
          !isActiveUnpublishing &&
          !isEditMode &&
          activePublishState?.socialMediaId &&
          activePublishState?.externalContentId && (
            <PublishedAnalytics
              socialMediaId={activePublishState.socialMediaId}
              externalContentId={activePublishState.externalContentId}
              platformType={activePublishState.socialMediaType ?? activePlatform}
            />
          )}

        {isActivePublished && isEditMode && (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200'>
            <div className='flex items-center gap-2'>
              <Pencil className='size-4' />
              <span>
                Editing caption —{' '}
                {activePlatform === 'facebook'
                  ? 'saved changes will push to Facebook.'
                  : `${activePlatform} does not support editing after publish; unpublish and repost instead.`}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setIsEditMode(false)}
                disabled={isSubmittingUpdate}
                className='inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-zinc-900/40 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSaveCaptionEdit}
                disabled={isSubmittingUpdate || activePlatform !== 'facebook'}
                className='inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-60'
                title={
                  activePlatform !== 'facebook' ? 'Only Facebook supports caption edits after publishing.' : undefined
                }
              >
                {isSubmittingUpdate ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <CheckIcon className='size-3.5' />
                )}
                Save changes
              </button>
            </div>
          </div>
        )}

        <div className={`space-y-2 ${isActiveLocked || isCaptionGenerating ? 'opacity-60 pointer-events-none' : ''}`}>
          <MenuBar editor={editor} />

          <EditorContent
            editor={editor}
            onClick={() => {
              if (isActiveLocked || isCaptionGenerating) return;
              editor?.chain().focus().run();
            }}
            className='post-builder-editor rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)]'
          />

          {/* Per-platform caption counter. Red when past the hard API cap (Threads 500 /
              Meta+TikTok 2200), amber when past the recommended length for the current
              (platform, mode), zinc otherwise. Matches BuildToneGuidance on the BE. */}
          <div
            className={cn(
              'flex items-center justify-end text-[11px] tabular-nums',
              isOverMax ? 'text-rose-400' : isOverRecommended ? 'text-amber-400' : 'text-zinc-500'
            )}
          >
            {activeCaptionLength} / {captionLimits.recommended}
            {captionLimits.max !== captionLimits.recommended && (
              <span className='ml-1 text-zinc-600'>(max {captionLimits.max})</span>
            )}
          </div>
        </div>

        <div className='border-t border-white/10 pt-5 space-y-3'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <PlatformPicker
              selectedPlatforms={generatePlatforms}
              isOpen={showPlatformPicker}
              onToggleOpen={() => setShowPlatformPicker((prev) => !prev)}
              onTogglePlatform={toggleGeneratePlatform}
              disabledPlatforms={pickerDisabledPlatforms}
              platformsWithoutMedia={platformsWithoutMedia}
            />

            {/* Caption-generation language. VN/EN are the two we enforce on BE prompt
                normalization for now; other strings pass through verbatim if extended. */}
            <label className='flex items-center gap-1.5 text-xs text-zinc-400'>
              <span>Language</span>
              <select
                value={captionLanguage}
                onChange={(e) => setCaptionLanguage(e.target.value as CaptionLanguage)}
                disabled={isGenerating}
                className='cursor-pointer rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
              >
                <option value='en'>English</option>
                <option value='vi'>Vietnamese</option>
              </select>
            </label>
          </div>

          <div className='flex items-center justify-center gap-3'>
            <Button
              type='button'
              disabled={isGenerating || generatePlatforms.size === 0 || isActiveLocked}
              className='w-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
              onClick={handleGenerate}
            >
              {isGenerating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {generateLabel}
            </Button>
          </div>
        </div>
      </div>

      <DialogConfirmUnpublish
        isOpen={isUnpublishConfirmOpen}
        platformLabel={activePlatform === 'thread' ? 'Threads' : activePlatform}
        onClose={() => setIsUnpublishConfirmOpen(false)}
        onConfirm={handleUnpublish}
        isSubmitting={isSubmittingUnpublish}
      />

      <DialogInsufficientCoins
        isOpen={isInsufficientOpen}
        onClose={() => setIsInsufficientOpen(false)}
        requiredCoins={captionCostQuote?.totalCoins}
        currentBalance={currentBalance}
        message='Caption generation requires more MeAI coins than you currently have.'
      />
    </div>
  );
}

export default ContentCreation;
