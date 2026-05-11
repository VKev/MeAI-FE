import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePostBuilder, { type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { CheckIcon, Copy, Loader2, LockIcon, RotateCw } from 'lucide-react';
import { useParams } from 'react-router';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { estimateCoinCost, type CoinCostQuote } from '@/services/client/coin-pricing.client';
import { useUserStore } from '@/store/user.store';
import { useOptimisticCoinDebit } from '@/hooks/useOptimisticCoinDebit';
import { toast } from 'sonner';
import { ALL_PLATFORMS, buildCaptionPayloads, applyCaptionResults, loadSavedCaptions } from './common/caption-utils';
import { PlatformPicker } from './common/PlatformPicker';
import { getCaptionLimits } from '@/routes/post-builder/hooks/platform-char-limits';
import { cn } from '@/lib/utils';
import { useRefetchUser } from '@/utils/user-state';

type CaptionLanguage = 'en' | 'vi';

function ContentCreation() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const platformAvailability = usePostBuilder((state) => state.platformAvailability);
  const enabledPlatforms = useMemo(
    () => (Object.keys(platformAvailability) as PostBuilderPlatform[]).filter((p) => platformAvailability[p]),
    [platformAvailability]
  );
  const [generatePlatforms, setGeneratePlatforms] = useState<Set<PostBuilderPlatform>>(() => new Set(enabledPlatforms));
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
    for (const p of enabledPlatforms) {
      const mode = platformModes[p];
      const info = platformPublishStates[p]?.[mode];
      if (info?.status === 'published' || info?.status === 'publishing' || info?.status === 'unpublishing') {
        locked.add(p);
      }
    }
    return locked;
  }, [enabledPlatforms, platformModes, platformPublishStates]);

  // Pixtral needs images/videos to ground its captions. A platform with no media in its
  // active mode has nothing to show to the model — exclude it from the picker AND drop
  // it from the `generatePlatforms` set so the cost estimate + button label reflect what
  // will actually be sent to the BE.
  const platformsWithoutMedia = useMemo(() => {
    const empty = new Set<PostBuilderPlatform>();
    for (const p of enabledPlatforms) {
      const mode = platformModes[p];
      const ids = previewStates[p]?.selectedMediaIds?.[mode] ?? [];
      if (ids.length === 0) empty.add(p);
    }
    return empty;
  }, [enabledPlatforms, platformModes, previewStates]);

  // Merge both gating sets so the picker shows the same disabled UI for either reason.
  const pickerDisabledPlatforms = useMemo(() => {
    const set = new Set<PostBuilderPlatform>(lockedForGeneration);
    for (const p of platformsWithoutMedia) set.add(p);
    return set;
  }, [lockedForGeneration, platformsWithoutMedia]);
  const isActivePublishing = activePublishState?.status === 'publishing';
  const isActiveUnpublishing = activePublishState?.status === 'unpublishing';
  const isActiveLocked = isActivePublished || isActivePublishing || isActiveUnpublishing;

  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id,
    refetchOnMount: 'always'
  });

  const handleContentChange = (nextContent: string) => {
    setRawContent({ content: nextContent });
  };

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
    setGeneratePlatforms(new Set(enabledPlatforms));
  }, [enabledPlatforms]);

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
  // Seed saved captions only once per mount so we don't overwrite live typing when the
  // query refetches after autosave or publish activity.
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

        {isActivePublished && !isActiveUnpublishing && (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>
            <div className='flex items-center gap-2'>
              <LockIcon className='size-4' />
              <span>
                <span className='capitalize'>{activePlatform}</span>{' '}
                <span className='uppercase text-xs'>{activeMode}</span> is published.
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => toast('navigate post detail')}
                className='inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25'
              >
                detail -&gt;
              </button>
            </div>
          </div>
        )}

        <div className='space-y-2'>
          <textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            disabled={isActiveLocked || isCaptionGenerating}
            placeholder='Write your caption here...'
            className='min-h-48 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/70 disabled:cursor-not-allowed disabled:opacity-60'
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
              enabledPlatforms={enabledPlatforms}
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
