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
import { toast } from 'sonner';
import {
  ALL_PLATFORMS,
  buildCaptionPayloads,
  applyCaptionResults,
  loadSavedCaptions
} from './common/caption-utils';
import { PlatformPicker } from './common/PlatformPicker';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatePlatforms, setGeneratePlatforms] = useState<Set<PostBuilderPlatform>>(new Set(ALL_PLATFORMS));
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
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
  const isActivePublishing = activePublishState?.status === 'publishing';
  const isActiveUnpublishing = activePublishState?.status === 'unpublishing';
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmittingUnpublish, setIsSubmittingUnpublish] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
  const isActiveLocked =
    (isActivePublished || isActivePublishing || isActiveUnpublishing) && !isEditMode;
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
    editable: !isActiveLocked,
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
      const dbType = activeMode === 'reel' || activeMode === 'video' ? 'reels' : 'posts';
      const group = groups.find((g) => {
        const p = g.platform?.toLowerCase();
        const matchesPlatform = p === dbPlatform || (dbPlatform === 'instagram' && p === 'ig');
        if (!matchesPlatform) return false;
        if (activePlatform === 'facebook' || activePlatform === 'instagram') {
          return (g.type ?? '').toLowerCase() === dbType;
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
      const dbType = activeMode === 'reel' || activeMode === 'video' ? 'reels' : 'posts';
      const group = groups.find((g) => {
        const p = g.platform?.toLowerCase();
        const matchesPlatform = p === dbPlatform || (dbPlatform === 'instagram' && p === 'ig');
        if (!matchesPlatform) return false;
        if (activePlatform === 'facebook' || activePlatform === 'instagram') {
          return (g.type ?? '').toLowerCase() === dbType;
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
    editor.setEditable(!isActiveLocked);
  }, [editor, isActiveLocked]);

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
    if (lockedForGeneration.has(platform)) return;
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

  // Auto-drop locked platforms from the selected-generate set so a freshly-published
  // platform can't smuggle into the next Generate run.
  useEffect(() => {
    setGeneratePlatforms((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const p of lockedForGeneration) {
        if (next.delete(p)) changed = true;
      }
      return changed ? next : prev;
    });
  }, [lockedForGeneration]);

  const handleGenerate = async () => {
    if (!postBuilderData?.value) {
      toast.error('Post builder data not loaded');
      return;
    }

    setIsGenerating(true);

    try {
      const entries = buildCaptionPayloads(postBuilderData.value, generatePlatforms, platformModes, previewStates);

      if (entries.length === 0) {
        toast.error('No platforms with resources available to generate captions');
        setIsGenerating(false);
        return;
      }

      const response = await PostPrepareClientApi.createPostCaption({
        language: null,
        instruction: content || null,
        socialMedia: entries.map((e) => e.payload)
      });

      if (!response.isSuccess || !response.value) {
        throw new Error(response.error?.description || 'Failed to generate captions');
      }

      const savePromises = applyCaptionResults(response.value.socialMedia, entries, setPlatformContent);
      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
      setHasGenerated(true);
      toast.success('Captions generated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Rehydrate saved captions whenever the builder data updates — initial load, refetch
  // after publish, and switching between post-builders must all reseed platformContents.
  useEffect(() => {
    if (!postBuilderData?.value) return;
    const hasContent = loadSavedCaptions(postBuilderData.value, setPlatformContent);
    if (hasContent) setHasGenerated(true);
  }, [postBuilderData, setPlatformContent]);

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
    return hasGenerated ? 'Regenerate' : 'Generate';
  }, [hasGenerated, isGenerating]);

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
              <span className='uppercase text-xs'>{activeMode}</span> is publishing — editing is locked
              until all targets finish.
            </span>
          </div>
        )}

        {isActiveUnpublishing && (
          <div className='flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200'>
            <RotateCw className='size-4 animate-spin' />
            <span>
              <span className='capitalize'>{activePlatform}</span>{' '}
              <span className='uppercase text-xs'>{activeMode}</span> is being removed from the platform —
              you'll get a notification when it's back to draft.
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
              <button
                type='button'
                onClick={() => {
                  editorInteractiveRef.current = true;
                  setIsEditMode(true);
                }}
                className='inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25'
              >
                <Pencil className='size-3.5' /> Edit caption
              </button>
              <button
                type='button'
                onClick={requestUnpublish}
                disabled={isSubmittingUnpublish}
                className='inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/25 disabled:opacity-60'
              >
                {isSubmittingUnpublish ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
                Unpublish
              </button>
            </div>
          </div>
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
                title={activePlatform !== 'facebook' ? 'Only Facebook supports caption edits after publishing.' : undefined}
              >
                {isSubmittingUpdate ? <Loader2 className='size-3.5 animate-spin' /> : <CheckIcon className='size-3.5' />}
                Save changes
              </button>
            </div>
          </div>
        )}

        <div className={`space-y-3 ${isActiveLocked ? 'opacity-60 pointer-events-none' : ''}`}>
          <MenuBar editor={editor} />

          <EditorContent
            editor={editor}
            onClick={() => {
              if (isActiveLocked) return;
              editor?.chain().focus().run();
            }}
            className='post-builder-editor rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)]'
          />
        </div>

        <div className='border-t border-white/10 pt-5 space-y-3'>
          <PlatformPicker
            selectedPlatforms={generatePlatforms}
            isOpen={showPlatformPicker}
            onToggleOpen={() => setShowPlatformPicker((prev) => !prev)}
            onTogglePlatform={toggleGeneratePlatform}
            disabledPlatforms={lockedForGeneration}
          />

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
    </div>
  );
}

export default ContentCreation;
