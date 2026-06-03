import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  AiRecommendationDraftPostInput,
  AiRecommendationMediaType,
  AiRecommendationStyle
} from '@/models/ai-recommendation.model';
import type { SocialMedia } from '@/models/social-media.model';
import {
  createAiRecommendationDraftPost,
  startAiContentSuggestion
} from '@/services/client/ai-recommendation.client';
import { estimateCoinCost } from '@/services/client/coin-pricing.client';
import { AI_CONTENT_SUGGESTION_EVENT, type AiContentSuggestionIntent } from '@/utils/ai-content-suggestion-intent';
import { getSocialMediaAvatar, getSocialMediaDisplayName } from '@/utils/social-media-display';
import { ImageIcon, Loader2, Sparkles, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const DEFAULT_STYLE: AiRecommendationStyle = 'branded';
const DEFAULT_IMAGE_COUNT = 1;
const MIN_IMAGE_COUNT = 1;
const MAX_IMAGE_COUNT = 4;
const AI_RECOMMENDATION_BILLING_MODEL = 'openrouter/draft-post-v1';
const COIN_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
});
const MEDIA_TYPE_OPTIONS: Array<{
  value: AiRecommendationMediaType;
  title: string;
  description: string;
  Icon: typeof ImageIcon;
}> = [
  {
    value: 'image',
    title: 'Image',
    description: 'Generate one or more still visuals.',
    Icon: ImageIcon
  },
  {
    value: 'video',
    title: 'Video',
    description: 'Generate one Veo 3.1 Fast clip.',
    Icon: Video
  }
];
const STYLE_OPTIONS: Array<{ value: AiRecommendationStyle; title: string; description: string }> = [
  {
    value: 'creative',
    title: 'Creative',
    description: 'Pure mood direction with no on-image text.'
  },
  {
    value: 'branded',
    title: 'Branded',
    description: 'Hero visual with subtle brand mark and optional headline.'
  },
  {
    value: 'marketing',
    title: 'Marketing',
    description: 'Promo flyer with logo, CTA, and contact on image.'
  }
];

type DialogAiRecommendationRequestProps = {
  open: boolean;
  accounts: SocialMedia[];
  defaultSocialMediaId?: string;
  workspaceId?: string | null;
  initialCorrelationId?: string | null;
  initialUserPrompt?: string | null;
  initialStyle?: string | null;
  initialMediaType?: string | null;
  initialSuggestionStatus?: string | null;
  onOpenChange: (open: boolean) => void;
};

function getAccountTypeLabel(account: SocialMedia) {
  return account.type?.toLowerCase() === 'facebook' ? 'Facebook Page' : account.type;
}

function clampImageCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_IMAGE_COUNT;
  }

  return Math.min(MAX_IMAGE_COUNT, Math.max(MIN_IMAGE_COUNT, Math.trunc(value)));
}

function formatCoinCost(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `${COIN_FORMATTER.format(value)} coins`;
}

function normalizeStyle(value: string | null | undefined): AiRecommendationStyle {
  return STYLE_OPTIONS.some((option) => option.value === value) ? (value as AiRecommendationStyle) : DEFAULT_STYLE;
}

function normalizeMediaType(value: string | null | undefined): AiRecommendationMediaType {
  return value === 'video' ? 'video' : 'image';
}

function DialogAiRecommendationRequest({
  open,
  accounts,
  defaultSocialMediaId,
  workspaceId,
  initialCorrelationId,
  initialUserPrompt,
  initialStyle,
  initialMediaType,
  initialSuggestionStatus,
  onOpenChange
}: DialogAiRecommendationRequestProps) {
  const [style, setStyle] = useState<AiRecommendationStyle>(DEFAULT_STYLE);
  const [userPrompt, setUserPrompt] = useState('');
  const [socialMediaId, setSocialMediaId] = useState('');
  const [imageCount, setImageCount] = useState(DEFAULT_IMAGE_COUNT);
  const [mediaType, setMediaType] = useState<AiRecommendationMediaType>('image');
  const [pendingContentSuggestionId, setPendingContentSuggestionId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      return;
    }

    const fallbackAccountId = defaultSocialMediaId ?? accounts[0]?.id ?? '';
    setStyle(normalizeStyle(initialStyle));
    setUserPrompt(initialUserPrompt ?? '');
    setSocialMediaId(fallbackAccountId);
    setImageCount(DEFAULT_IMAGE_COUNT);
    setMediaType(normalizeMediaType(initialMediaType));
  }, [accounts, defaultSocialMediaId, initialMediaType, initialStyle, initialUserPrompt, open]);

  useEffect(() => {
    if (!pendingContentSuggestionId || initialCorrelationId !== pendingContentSuggestionId) {
      return;
    }

    const status = initialSuggestionStatus?.toLowerCase();
    const hasPrompt = Boolean(initialUserPrompt?.trim());

    if ((status === 'completed' && hasPrompt) || status === 'failed') {
      setPendingContentSuggestionId(null);
    }
  }, [initialCorrelationId, initialSuggestionStatus, initialUserPrompt, pendingContentSuggestionId]);

  useEffect(() => {
    if (!pendingContentSuggestionId || typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const intent = (event as CustomEvent<AiContentSuggestionIntent>).detail;
      if (!intent || intent.correlationId !== pendingContentSuggestionId) {
        return;
      }

      const status = intent.status?.toLowerCase();
      if (status === 'failed') {
        setPendingContentSuggestionId(null);
        return;
      }

      if (intent.userPrompt?.trim()) {
        setPendingContentSuggestionId(null);
        setUserPrompt(intent.userPrompt);
        setSocialMediaId(intent.socialMediaId);
        setStyle(normalizeStyle(intent.style));
        setMediaType(normalizeMediaType(intent.mediaType));
      }
    };

    window.addEventListener(AI_CONTENT_SUGGESTION_EVENT, handler);
    return () => window.removeEventListener(AI_CONTENT_SUGGESTION_EVENT, handler);
  }, [pendingContentSuggestionId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === socialMediaId) ?? accounts[0],
    [accounts, socialMediaId]
  );

  const { data: costEstimate, isFetching: isCostEstimateFetching } = useQuery({
    queryKey: ['coin-pricing', 'estimate', 'ai-recommendation', AI_RECOMMENDATION_BILLING_MODEL],
    queryFn: ({ signal }) =>
      estimateCoinCost(
        {
          actionType: 'draft_post_generation',
          model: AI_RECOMMENDATION_BILLING_MODEL,
          variant: null,
          quantity: 1
        },
        signal
      ),
    enabled: open,
    retry: false,
    staleTime: 60_000
  });

  const recommendationCostLabel = costEstimate?.isSuccess
    ? formatCoinCost(costEstimate.value.totalCoins)
    : null;
  const recommendationButtonLabel = recommendationCostLabel
    ? `Request Recommendation - ${recommendationCostLabel}`
    : isCostEstimateFetching
      ? 'Request Recommendation - estimating...'
      : 'Request Recommendation';

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!socialMediaId) {
        throw new Error('Please choose an account before generating an AI recommendation.');
      }

      const payload: AiRecommendationDraftPostInput = {
        imageCount,
        mediaType,
        maxRagPosts: 30,
        maxReferenceImages: 3,
        style,
        topK: 6,
        userPrompt: userPrompt.trim() || null,
        workspaceId: workspaceId ?? null
      };

      return createAiRecommendationDraftPost(socialMediaId, payload);
    },
    onSuccess: (response) => {
      onOpenChange(false);
      const recommendationId = response.value?.resultPostId ?? response.value?.correlationId;

      if (recommendationId) {
        if (workspaceId) {
          navigate(`/workspace/${workspaceId}/product/ai-recommendation/${recommendationId}`);
        } else {
          navigate(`/user/product/ai-recommendation/${recommendationId}`);
        }
      }
    }
  });

  const contentSuggestionMutation = useMutation({
    mutationFn: async () => {
      if (!socialMediaId) {
        throw new Error('Please choose an account before asking AI for a content idea.');
      }

      return startAiContentSuggestion(socialMediaId, {
        instruction: userPrompt.trim() || null,
        mediaType,
        style,
        topK: 6,
        maxRagPosts: 30,
        refreshIndex: true,
        workspaceId: workspaceId ?? null
      });
    },
    onSuccess: (response) => {
      setPendingContentSuggestionId(response.value?.correlationId ?? null);
      toast.success('Content suggestion queued', {
        description: 'AI will notify you when the suggested prompt is ready.'
      });
    },
    onError: (error: any) => {
      setPendingContentSuggestionId(null);
      toast.error('Unable to start content suggestion', {
        description: error?.message
      });
    }
  });

  const handleSubmit = () => {
    draftMutation.mutate();
  };

  const handleSuggestContent = () => {
    contentSuggestionMutation.mutate();
  };

  const isContentSuggestionBusy = contentSuggestionMutation.isPending || Boolean(pendingContentSuggestionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,26,0.98)_0%,rgba(7,9,16,0.98)_100%)] p-4 text-white shadow-[0_30px_100px_-40px_rgba(124,58,237,0.55)] sm:w-full sm:p-6'>
        <DialogHeader className='flex flex-row items-start justify-start gap-3 pr-8'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200'>
            <Sparkles className='h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <DialogTitle className='break-words text-xl font-semibold tracking-tight sm:text-2xl'>
              AI recommendation
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Request an AI-generated recommendation draft for a connected social account.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className='space-y-3'>
          <section className='space-y-3'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-white'>Account</p>
                <p className='text-xs text-slate-500'>Select the social account for this request.</p>
              </div>
              {selectedAccount && (
                <span className='block max-w-full truncate text-xs text-slate-400 sm:max-w-[16rem]'>
                  {getSocialMediaDisplayName(selectedAccount)}
                </span>
              )}
            </div>

            <div className='max-h-56 space-y-2 overflow-y-auto pr-1'>
              {accounts.length > 0 ? (
                accounts.map((account) => {
                  const isActive = account.id === socialMediaId;
                  return (
                    <button
                      key={account.id}
                      type='button'
                      onClick={() => setSocialMediaId(account.id)}
                      className={cn(
                        'flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)_inset]'
                          : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          isActive ? 'border-violet-300 bg-violet-400/20' : 'border-white/20'
                        )}
                      >
                        <div
                          className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-violet-300' : 'bg-transparent')}
                        />
                      </div>
                      <Avatar className='h-10 w-10 shrink-0 border border-white/10'>
                        <AvatarImage src={getSocialMediaAvatar(account)} alt={getSocialMediaDisplayName(account)} />
                        <AvatarFallback className='bg-white/5 text-xs font-semibold text-slate-300'>
                          {getSocialMediaDisplayName(account).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-white'>{getSocialMediaDisplayName(account)}</p>
                        <p className='truncate text-xs text-slate-500'>{getAccountTypeLabel(account)}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className='rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-slate-400'>
                  No social accounts were found.
                </div>
              )}
            </div>
          </section>

          <section className='space-y-3'>
            <div>
              <p className='text-sm font-semibold text-white'>Media type</p>
              <p className='text-xs text-slate-500'>Choose the generated media for this recommendation draft.</p>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {MEDIA_TYPE_OPTIONS.map((option) => {
                const isActive = mediaType === option.value;
                return (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setMediaType(option.value)}
                    className={cn(
                      'flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all',
                      isActive
                        ? 'border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)_inset]'
                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                    )}
                  >
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200'>
                      <option.Icon className='h-4 w-4' />
                    </span>
                    <span className='min-w-0'>
                      <span className='block text-sm font-medium text-white'>{option.title}</span>
                      <span className='block text-xs text-slate-500'>{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className='grid gap-4 lg:grid-cols-[1fr_180px]'>
            <div className='space-y-3'>
              <div>
                <p className='text-sm font-semibold text-white'>Style</p>
                <p className='text-xs text-slate-500'>Select the writing style for the AI recommendation.</p>
              </div>

              <div className='grid grid-cols-3 gap-2'>
                {STYLE_OPTIONS.map((option) => {
                  const isActive = style === option.value;
                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setStyle(option.value)}
                      className={cn(
                        'min-w-0 rounded-2xl border px-2 py-3 text-left transition-all sm:px-3',
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)_inset]'
                          : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                      )}
                    >
                      <div className='flex min-w-0 items-center justify-between gap-1.5 sm:gap-2'>
                        <p className='min-w-0 whitespace-nowrap text-[12px] font-medium leading-snug text-white sm:text-sm'>
                          {option.title}
                        </p>
                        <span
                          className={cn('h-2 w-2 shrink-0 rounded-full', isActive ? 'bg-violet-300' : 'bg-white/20')}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {mediaType === 'image' ? (
              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-semibold text-white'>Images</p>
                  <p className='text-xs text-slate-500'>Generated media count.</p>
                </div>
                <label className='flex h-[74px] min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/3 px-4 transition-colors focus-within:border-violet-400/40 focus-within:bg-white/5'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200'>
                    <ImageIcon className='h-4 w-4' />
                  </span>
                  <Input
                    aria-label='Number of generated images'
                    type='number'
                    min={MIN_IMAGE_COUNT}
                    max={MAX_IMAGE_COUNT}
                    step={1}
                    value={imageCount}
                    onChange={(event) => setImageCount(clampImageCount(Number(event.target.value)))}
                    className='h-10 min-w-0 border-white/10 bg-black/25 text-center text-base font-semibold text-white focus-visible:ring-violet-500/20'
                  />
                </label>
              </div>
            ) : (
              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-semibold text-white'>Video preset</p>
                  <p className='text-xs text-slate-500'>Fixed recommendation preset.</p>
                </div>
                <div className='flex h-[74px] min-w-0 flex-col justify-center rounded-2xl border border-violet-400/25 bg-violet-500/8 px-4'>
                  <p className='text-xs font-semibold text-violet-100'>Veo 3.1 Fast</p>
                  <p className='mt-1 text-[11px] text-slate-400'>720p · 8 seconds · up to 3 RAG references</p>
                </div>
              </div>
            )}
          </section>

          <section className='space-y-3'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <p className='text-sm font-semibold text-white'>Prompt</p>
                <p className='text-xs text-slate-500'>
                  Provide a prompt, or let AI suggest a fresh non-duplicate idea for this account.
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSuggestContent}
                disabled={isContentSuggestionBusy || !socialMediaId || accounts.length === 0}
                className='w-full shrink-0 border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 sm:w-auto'
              >
                {isContentSuggestionBusy && <Loader2 className='h-4 w-4 animate-spin' />}
                {isContentSuggestionBusy ? 'Suggesting...' : 'Suggest content'}
              </Button>
            </div>

            <Textarea
              value={userPrompt}
              onChange={(event) => setUserPrompt(event.target.value)}
              placeholder='Example: Write a post about our new summer skincare bundle for small business owners.'
              className='h-36 max-h-56 min-h-28 resize-y overflow-y-auto break-words border-white/10 bg-white/3 text-white placeholder:text-slate-500 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 [field-sizing:fixed]'
            />
          </section>
        </div>

        <DialogFooter className='flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            className='w-full border-white/10 bg-white/3 text-white hover:bg-white/6 sm:w-auto'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={draftMutation.isPending || !socialMediaId || accounts.length === 0}
            className='w-full min-w-0 whitespace-normal bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_16px_40px_-20px_rgba(168,85,247,0.8)] hover:from-violet-500 hover:to-fuchsia-500 sm:w-auto'
          >
            {draftMutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
            {draftMutation.isPending ? 'Requesting...' : recommendationButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogAiRecommendationRequest;
