import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import { CheckIcon, Copy, Loader2, LockIcon, RotateCw } from 'lucide-react';
import { useParams } from 'react-router';
import { PostPrepareClientApi } from '@/services/client/post-prepare.client';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { useUserStore } from '@/store/user.store';
import { useOptimisticCoinDebit } from '@/hooks/useOptimisticCoinDebit';
import { toast } from 'sonner';
import { buildCaptionText, loadSavedCaptions, type BuiltCaption } from './common/caption-utils';
import { getCaptionLimits } from '@/routes/post-builder/hooks/platform-char-limits';
import { cn } from '@/lib/utils';
import { useRefetchUser } from '@/utils/user-state';
import { normalizePostType, resolvePostTypeForMode } from '@/routes/post-builder/hooks/publish-utils';
import { updatePost } from '@/services/client/post.client';
import type { TSocialMediaCaptionsByPost } from '@/models/post-prepare.model';

type CaptionLanguage = 'vn' | 'en' | 'auto';
type CaptionStyle = 'auto' | 'creative' | 'marketing';

function normalizePlatformForCompare(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'ig') return 'instagram';
  if (normalized === 'threads') return 'threads';
  return normalized;
}

function resolvePlatformForApi(platform: 'tiktok' | 'facebook' | 'instagram' | 'threads'): string {
  return platform === 'threads' ? 'threads' : platform;
}

function resolveActivePostId(
  socialMedia: Array<{
    platform: string | null;
    type: string | null;
    posts: Array<{ id: string }>;
  }>,
  platform: 'tiktok' | 'facebook' | 'instagram' | 'threads',
  mode: 'post' | 'reel' | 'video' | 'image'
): string | null {
  const targetPlatform = resolvePlatformForApi(platform);
  const targetType = resolvePostTypeForMode(platform, mode);

  const matched = socialMedia.find((group) => {
    return (
      normalizePlatformForCompare(group.platform) === targetPlatform && normalizePostType(group.type) === targetType
    );
  });

  if (matched?.posts?.[0]?.id) return matched.posts[0].id;

  const fallback = socialMedia.find((group) => normalizePlatformForCompare(group.platform) === targetPlatform);
  return fallback?.posts?.[0]?.id ?? null;
}

function buildCaptionFromResponse(
  responseValue: {
    socialMedia?: TSocialMediaCaptionsByPost[];
    caption?: string;
    hashtags?: string[];
    trendingHashtags?: string[];
    callToAction?: string | null;
  },
  postId: string
): BuiltCaption | null {
  const fromList = responseValue.socialMedia?.find((item) => item.postId === postId) ?? responseValue.socialMedia?.[0];
  if (fromList) {
    return buildCaptionText(fromList);
  }

  if (!responseValue.caption) return null;
  const hashtags = [...(responseValue.hashtags ?? []), ...(responseValue.trendingHashtags ?? [])];
  const hashtagStr = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return { captionText: responseValue.caption, hashtagStr };
}

function ContentCreation() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState<CaptionLanguage>('auto');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('creative');
  const [maxTokensInput, setMaxTokensInput] = useState('3');
  const [useWebSearch, setUseWebSearch] = useState(false);

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
  const previewStates = usePostBuilder((state) => state.previewStates);
  const content = usePostBuilder((state) => state.content);
  const activeMode = usePostBuilder((state) => state.platformModes[state.activePlatform]);
  const activePublishState = usePostBuilder(
    (state) => state.platformPublishStates[state.activePlatform]?.[state.platformModes[state.activePlatform]]
  );
  const isActivePublished = activePublishState?.isPublished === true;

  const isActivePublishing = activePublishState?.status === 'publishing';
  const isActiveUnpublishing = activePublishState?.status === 'unpublishing';
  const isActiveLocked = isActivePublished || isActivePublishing || isActiveUnpublishing;
  const activeResourceIds = previewStates[activePlatform]?.selectedMediaIds?.[activeMode] ?? [];

  const { id } = useParams();
  const queryClient = useQueryClient();
  const currentBalance = useUserStore((s) => Number(s.user?.meAiCoin ?? 0));

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', id],
    queryFn: () => PostBuilderClientApi.getPostBuilder(id!),
    enabled: !!id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always'
  });

  const activeModePostId = useMemo(() => {
    const socialMedia = postBuilderData?.value?.socialMedia ?? [];
    return resolveActivePostId(socialMedia, activePlatform, activeMode);
  }, [postBuilderData, activePlatform, activeMode]);

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

  const handleGenerate = async () => {
    if (!postBuilderData?.value) {
      toast.error('Post builder data not loaded');
      return;
    }

    if (!activeModePostId) {
      toast.error('No target post found for current platform mode');
      return;
    }

    if (activeResourceIds.length === 0) {
      toast.error('Please select media before generating content');
      return;
    }

    const requestedTokens = Number(maxTokensInput);
    if (!Number.isFinite(requestedTokens) || requestedTokens < 3) {
      toast.error('Max Coins must be at least 3');
      return;
    }

    if (requestedTokens > currentBalance) {
      setIsInsufficientOpen(true);
      return;
    }

    setIsGenerating(true);
    // Flip the store flag so PostBuilderHeader's Publish / Save Draft go disabled until
    // the generated captions have landed in `platformContents`.
    setCaptionGenerating(true);

    // Optimistic debit coins from store
    const cost = requestedTokens;
    const context = debitCoins(cost);

    try {
      const response = await PostPrepareClientApi.createPostCaption({
        language: captionLanguage,
        instruction: content,
        postId: activeModePostId,
        platform: resolvePlatformForApi(activePlatform),
        resourceIds: activeResourceIds,
        maxTokens: maxTokensInput,
        style: captionStyle,
        webSearch: useWebSearch
      });

      if (!response.isSuccess || !response.value) {
        throw new Error(response.error?.description || 'Failed to generate captions');
      }

      const built = buildCaptionFromResponse(response.value, activeModePostId);
      if (!built) {
        throw new Error('No generated caption returned');
      }

      const fullText = built.hashtagStr ? `${built.captionText}\n\n${built.hashtagStr}` : built.captionText;
      setPlatformContent(activePlatform, activeMode, { content: fullText });

      await updatePost(activeModePostId, {
        content: {
          content: built.captionText,
          hashtag: built.hashtagStr || null,
          resource_list: activeResourceIds,
          post_type: resolvePostTypeForMode(activePlatform, activeMode)
        }
      });

      queryClient.invalidateQueries({ queryKey: ['post-builder', id] });
      // Refetch user profile to reconcile coin balance
      void refetchUser();
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

  const hasSeededCaptionsRef = useRef(false);
  useEffect(() => {
    if (!postBuilderData?.value) return;
    if (hasSeededCaptionsRef.current) return;
    const hasContent = loadSavedCaptions(postBuilderData.value, setPlatformContent);
    if (hasContent && !maxTokensInput) {
      setMaxTokensInput(String(currentBalance > 0 ? Math.min(currentBalance, 10) : 1));
    }
    hasSeededCaptionsRef.current = true;
  }, [postBuilderData, setPlatformContent, maxTokensInput, currentBalance]);

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

  const parsedMaxTokens = Number(maxTokensInput);
  const isMaxTokensValid =
    Number.isFinite(parsedMaxTokens) && parsedMaxTokens >= 3 && parsedMaxTokens <= currentBalance;
  const canGenerate =
    !isGenerating && !isActiveLocked && activeResourceIds.length > 0 && !!activeModePostId && isMaxTokensValid;

  return (
    <>
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
                <span className='uppercase text-xs'>{activeMode}</span> is being removed from the platform — you'll get
                a notification when it's back to draft.
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
              placeholder='Write your caption or instructions here...'
              className='min-h-48 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,20,0.82)_0%,rgba(8,10,16,0.9)_100%)] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/70 disabled:cursor-not-allowed disabled:opacity-60'
            />

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
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <label className='flex items-center gap-2 text-xs text-zinc-400'>
                <span>Language</span>
                <select
                  value={captionLanguage}
                  onChange={(e) => setCaptionLanguage(e.target.value as CaptionLanguage)}
                  disabled={isGenerating}
                  className='cursor-pointer rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
                >
                  <option value='auto'>Auto</option>
                  <option value='en'>English</option>
                  <option value='vn'>Vietnamese</option>
                </select>
              </label>

              <label className='flex items-center gap-2 text-xs text-zinc-400'>
                <span>Style</span>
                <select
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value as CaptionStyle)}
                  disabled={isGenerating}
                  className='cursor-pointer rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
                >
                  <option value='creative'>Creative</option>
                  <option value='marketing'>Marketing</option>
                </select>
              </label>

              <label className='flex items-center gap-2 text-xs text-zinc-400'>
                <span>
                  Max Coins (<span className='text-[11px]'>{currentBalance}</span>)
                </span>

                <input
                  type='number'
                  min={3}
                  max={Math.max(currentBalance, 1)}
                  value={maxTokensInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === '') {
                      setMaxTokensInput('');
                      return;
                    }
                    const numeric = Number(next);
                    if (!Number.isFinite(numeric) || numeric < 0) return;
                    setMaxTokensInput(String(Math.min(numeric, currentBalance)));
                  }}
                  disabled={isGenerating}
                  className='w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60'
                />
              </label>

              <label className='flex items-center gap-2 text-xs text-zinc-400'>
                <span>Web Search</span>
                <input
                  type='checkbox'
                  checked={useWebSearch}
                  onChange={(event) => setUseWebSearch(event.target.checked)}
                  disabled={isGenerating}
                  className='h-4 w-4 rounded border-white/20 bg-zinc-900 text-purple-500'
                />
              </label>
            </div>

            <div className='flex items-center justify-center gap-3'>
              <Button
                type='button'
                disabled={!canGenerate}
                className='w-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
                onClick={handleGenerate}
              >
                {isGenerating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>
      <DialogInsufficientCoins
        isOpen={isInsufficientOpen}
        onClose={() => setIsInsufficientOpen(false)}
        requiredCoins={Number(maxTokensInput || 0)}
        currentBalance={currentBalance}
        message='Caption generation requires more MeAI coins than you currently have.'
      />
    </>
  );
}

export default ContentCreation;
