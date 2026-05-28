import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Archive,
  Calendar,
  Eye,
  Globe,
  MoreVertical,
  Package,
  Loader2,
  Inbox,
  Clock,
  AlertCircle,
  FileText,
  Edit,
  Trash,
  BarChart2,
  Filter,
  X,
  ChevronDown,
  Check,
  Hash,
  Paperclip,
  WandSparkles,
  BotIcon,
  ImageOffIcon,
  GlobeLock,
  RefreshCw,
  RotateCcw,
  PackagePlusIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import { toast } from 'sonner';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { PLATFORM_CONFIG, STATUS_CONFIG, type PlatformType, type PostStatus } from '../user/product-config';
import { cn } from '@/lib/utils';
import type { Post } from '@/models/post.model';
import { usePosts } from '../user/hooks/usePosts';
import { useIntersectionObserver } from '../user/hooks/useIntersectionObserver';
import { PlatformStack } from '@/components/ui/platform-stack';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchFacebookPages, fetchSocialMedias } from '@/services/client/social-media.client';
import {
  createPost,
  deletePost,
  unpublishMeAiFeedPost,
  unpublishPost,
  updatePost,
  updatePublishedPost,
  type CreatePostPayload
} from '@/services/client/post.client';
import type { SocialMedia } from '@/models/social-media.model';
import type { PostFilters } from '../user/hooks/usePosts';
import { Button } from '@/components/ui/button';
import DialogAiRecommendationRequest from '@/components/ai-recommendation/DialogAiRecommendationRequest';
import ProductViewDialog from '@/components/product/ProductViewDialog';
import ProductDeleteConfirmDialog from '@/components/product/ProductDeleteConfirmDialog';
import ProductScheduleConfirmDialog from '@/components/product/ProductScheduleConfirmDialog';
import EditPublishedPostDialog from '@/components/product/EditPublishedPostDialog';
import DialogInsufficientCoins from '@/components/common/DialogInsufficientCoins';
import { useUserStore } from '@/store/user.store';
import { useUserCoins } from '@/utils/user-state';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';
import { completeTutorialStep } from '@/services/client/profile.client';
import {
  getSocialMediaAvatar,
  getSocialMediaDisplayName,
  mergeFacebookPagesWithAccounts
} from '@/utils/social-media-display';

// Utility for relative date formatting
function parseApiDate(value: string | null) {
  if (!value) return null;
  const normalizedValue = value.trim().replace(/^"+|"+$/g, '');
  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatRelativeDate(value: string | null) {
  const date = parseApiDate(value);
  if (!date) return 'Unknown time';
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const absSeconds = Math.abs(diffInSeconds);
  if (absSeconds < 60) return formatter.format(diffInSeconds, 'second');
  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) return formatter.format(diffInMinutes, 'minute');
  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) return formatter.format(diffInHours, 'hour');
  const diffInDays = Math.round(diffInHours / 24);
  return formatter.format(diffInDays, 'day');
}

// Components
const SkeletonCard = () => (
  <div className='relative h-70 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 animate-pulse'>
    <div className='mb-4 h-30 w-full rounded-2xl bg-white/5' />
    <div className='flex items-start justify-between mb-4'>
      <div className='h-8 w-24 rounded-lg bg-white/10' />
      <div className='h-5 w-5 rounded-full bg-white/10' />
    </div>
    <div className='space-y-2 mb-6'>
      <div className='h-4 w-3/4 rounded bg-white/10' />
      <div className='h-3 w-1/2 rounded bg-white/10' />
    </div>
  </div>
);

const EmptyState = ({ message, ctaText }: { message: string; ctaText?: string }) => (
  <div className='flex flex-col items-center justify-center py-24 text-center space-y-6'>
    <div className='flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 shadow-inner'>
      <Inbox className='h-12 w-12 text-slate-500/50' />
    </div>
    <div className='space-y-2 max-w-sm'>
      <p className='text-xl font-semibold text-white'>No products found</p>
      <p className='text-sm text-slate-400'>{message}</p>
    </div>
  </div>
);

interface ProductCardProps {
  product: Post;
  onView: (product: Post) => void;
  onEdit: (product: Post) => void;
  onDelete: (product: Post) => void;
  onConvertToDraft?: (product: Post) => void;
}

const ProductCard = ({ product, onView, onEdit, onDelete, onConvertToDraft }: ProductCardProps) => {
  const status = (product.status as PostStatus) || 'failed';
  const aiImproveStatus = product.aiImproveStatus?.toLowerCase() ?? null;
  const aiRecommendationStatus = product.aiRecommendationStatus?.toLowerCase() ?? null;
  
  // Stalled task heuristic (5 minutes timeout)
  const updatedAtTime = product.updatedAt ? new Date(product.updatedAt).getTime() : 0;
  const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;

  const isAiImproveRunning = (aiImproveStatus === 'submitted' || aiImproveStatus === 'processing') && status !== 'failed' && !isStalled;
  const isAiImprovementReady = aiImproveStatus === 'completed';
  const isAiImproveFailed = aiImproveStatus === 'failed' || ((aiImproveStatus === 'submitted' || aiImproveStatus === 'processing') && isStalled);
  const isAiRecommendationFailed = product.isAiRecommendedDraft && (status === 'failed' || aiRecommendationStatus === 'failed' || (!product.isAiRecommendationDone && isStalled));
  const isAiRecommendationRunning = product.isAiRecommendedDraft && !product.isAiRecommendationDone && status !== 'failed' && !isAiRecommendationFailed;
  const isProcessing = status === 'processing' || isAiImproveRunning || isAiRecommendationRunning;
  const hasTikTokPublication = product.publications?.some((pub) => pub.socialMediaType === 'tiktok');
  const hasFacebookPublication = product.publications?.some((pub) => pub.socialMediaType === 'facebook');
  const hasMeAiFeedPublication = product.publications?.some((pub) => pub.socialMediaType === 'meai_feed');

  const _renderDropdownMenuOpts = useCallback(() => {
    if (isAiRecommendationRunning || isAiImproveRunning) {
      return (
        <DropdownMenuItem
          className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
          onClick={() => onView(product)}
        >
          <Eye className='mr-2 h-4 w-4' /> View Details
        </DropdownMenuItem>
      );
    }

    if (status === 'draft' || status === 'scheduled') {
      return (
        <>
          <DropdownMenuItem
            className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
            onClick={() => onView(product)}
          >
            <Eye className='mr-2 h-4 w-4' /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
            onClick={() => onEdit(product)}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className='bg-white/5' />
          {!isAiImproveRunning && (
            <DropdownMenuItem
              className='text-rose-400 hover:bg-rose-500/10 hover:text-rose-400! cursor-pointer py-2'
              onClick={() => onDelete(product)}
            >
              <Trash className='mr-2 h-4 w-4 text-rose-400' /> Delete
            </DropdownMenuItem>
          )}
        </>
      );
    }

    if (status === 'published') {
      return (
        <>
          <DropdownMenuItem
            className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
            onClick={() => onView(product)}
          >
            <BarChart2 className='mr-2 h-4 w-4' /> View Analytics
          </DropdownMenuItem>
          {(hasFacebookPublication || hasMeAiFeedPublication) && (
            <DropdownMenuItem
              className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
              onClick={() => onEdit(product)}
            >
              <Edit className='mr-2 h-4 w-4' /> Edit
            </DropdownMenuItem>
          )}

          {!hasTikTokPublication && (
            <>
              <DropdownMenuSeparator className='bg-white/5' />
              <DropdownMenuItem
                className='text-rose-400 hover:bg-rose-500/10 hover:text-rose-400! cursor-pointer py-2'
                onClick={() => onDelete(product)}
              >
                <GlobeLock className='mr-2 h-4 w-4 text-rose-400' /> Unpublish
              </DropdownMenuItem>
            </>
          )}
        </>
      );
    }

    return (
      <>
        {/* view error message (optional) */}
        {/* <DropdownMenuItem
          className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
          onClick={() => onView(product)}
        >
          <Eye className='mr-2 h-4 w-4' /> View Failed Reason
        </DropdownMenuItem>
        <DropdownMenuSeparator className='bg-white/5' /> */}
        {onConvertToDraft && (
          <DropdownMenuItem
            className='hover:bg-white/5 hover:text-white cursor-pointer py-2'
            onClick={() => onConvertToDraft(product)}
          >
            <RotateCcw className='mr-2 h-4 w-4' /> Revert to Draft
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className='text-rose-400 hover:bg-rose-500/10 hover:text-rose-400! cursor-pointer py-2'
          onClick={() => onDelete(product)}
        >
          <Trash className='mr-2 h-4 w-4 text-rose-400' /> Delete
        </DropdownMenuItem>
      </>
    );
  }, [status, onView, onEdit, onDelete, onConvertToDraft, product, isAiRecommendationRunning, isAiImproveRunning]);

  const showingTime = useCallback(() => {
    if (status === 'scheduled' && product.schedule?.scheduledAtUtc) {
      return `Scheduled for ${new Date(product.schedule.scheduledAtUtc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }

    if (status === 'published' && product.publications?.length > 0 && product.publications[0].publishedAt) {
      return formatRelativeDate(product.publications[0].publishedAt);
    }

    return formatRelativeDate(product.createdAt);
  }, [status, product]);

  const _renderPlatformIcon = useCallback(() => {
    if (status === 'published' && product.publications && product.publications.length > 0) {
      return (
        <div className='flex items-center'>
          <PlatformStack publications={product.publications} />
        </div>
      );
    }

    const platform = product.platform ? PLATFORM_CONFIG[product.platform as PlatformType] : null;

    if (!platform) {
      return (
        <div className='flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-slate-400 font-medium'>
          <Globe className='h-3.5 w-3.5 text-slate-500' />
          <span>No Platform</span>
        </div>
      );
    }

    const Icon = platform.icon;

    return <Icon className='h-8 w-8' color={platform.color} />;
  }, [status, product]);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.03)]',
        isProcessing
          ? isAiRecommendationRunning
            ? 'border-fuchsia-500/30'
            : 'border-amber-500/30'
          : 'border-white/10 hover:border-white/20'
      )}
    >
      {/* Animated shimmer for processing state */}
      {isProcessing && (
        <div className='absolute inset-0 z-0 overflow-hidden rounded-3xl'>
          <div
            className={cn(
              'absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]',
              isAiRecommendationRunning
                ? 'bg-linear-to-r from-transparent via-fuchsia-500/10 to-transparent'
                : 'bg-linear-to-r from-transparent via-amber-500/10 to-transparent'
            )}
          />
        </div>
      )}

      {/* Preview Zone (16:9) */}
      <div className='relative z-10 aspect-video w-full bg-[#080a12] overflow-hidden'>
        {/* Actual Image if available */}
        {product.media && product.media.length > 0 && product.media[0].presignedUrl ? (
          <div className='absolute inset-0 z-0 overflow-hidden'>
            {product.media[0].resourceType === 'video' ? (
              <video
                src={product.media[0].presignedUrl}
                className='h-full w-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-out'
                muted
              />
            ) : (
              <img
                loading='lazy'
                src={product.media[0].presignedUrl}
                alt={product.title || 'Post thumbnail'}
                className='h-full w-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-out'
              />
            )}

            <div className='absolute inset-0 bg-linear-to-t from-[#080a12] via-[#080a12]/40 to-transparent' />
          </div>
        ) : (
          <div className='absolute flex items-center justify-center inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]'>
            <ImageOffIcon className='size-20 text-slate-500' />
          </div>
        )}

        <div className='relative z-10 flex items-start justify-between p-4'>
          <div className='flex flex-col items-start gap-2'>
            {isAiRecommendationRunning ? (
              <div className='flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-100 shadow-[0_0_20px_rgba(168,85,247,0.18)] backdrop-blur-xl'>
                <Loader2 className='h-3 w-3 animate-spin text-fuchsia-200' />
                Recommending
              </div>
            ) : (
              product.isAiRecommendedDraft && !isAiRecommendationFailed && (
                <div className='flex items-center gap-1.5 rounded-full border border-fuchsia-500/50 bg-linear-to-r from-violet-500/30 to-fuchsia-500/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-100 shadow-[0_0_20px_rgba(168,85,247,0.18)] backdrop-blur-xl transition-all duration-300'>
                  <BotIcon className='h-3 w-3 text-fuchsia-300' />
                  AI Recommendation
                </div>
              )
            )}
            {isAiRecommendationFailed && (
              <div className='flex items-center gap-1.5 rounded-full border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.16)] backdrop-blur-xl'>
                <AlertCircle className='h-3 w-3 text-rose-200' />
                Recommendation Failed
              </div>
            )}
            {isAiImproveRunning && (
              <div className='flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.18)] backdrop-blur-xl'>
                <Loader2 className='h-3 w-3 animate-spin text-amber-200' />
                Improving
              </div>
            )}
            {isAiImprovementReady && (
              <div className='flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.16)] backdrop-blur-xl'>
                <WandSparkles className='h-3 w-3 text-emerald-200' />
                Improvement Ready
              </div>
            )}
            {isAiImproveFailed && (
              <div className='flex items-center gap-1.5 rounded-full border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.16)] backdrop-blur-xl'>
                <AlertCircle className='h-3 w-3 text-rose-200' />
                Improve Failed
              </div>
            )}
          </div>

          {/* Action Menu — hidden during processing, except during AI recommendation & improving */}
          {(!isProcessing || isAiRecommendationRunning || isAiImproveRunning) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10 backdrop-blur-md'>
                  <MoreVertical className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-48 bg-[#0a0d1a]/95 backdrop-blur-xl border-white/10 text-slate-300'
              >
                {_renderDropdownMenuOpts()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className='relative z-10 flex flex-col flex-1 p-5'>
        <div className='space-y-1.5 mb-6 flex-1'>
          <h3
            title={product.content?.content || 'No content yet'}
            className='font-semibold text-white/90 truncate group-hover:text-white transition-colors leading-snug'
          >
            {product.content?.content || 'No content yet'}
          </h3>

          <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5'>
            <p className='text-[13px] text-slate-400 flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5 opacity-70' />
              {showingTime()}
            </p>

            {/* Metadata Indicators */}
            {product.content && (
              <div className='flex items-center gap-3 text-[12px] text-slate-500'>
                {product.content.post_type && (
                  <span className='px-2 py-1 rounded-full bg-white/5 border border-white/10'>
                    {product.content.post_type === 'reels' ? 'Reel' : 'Post'}
                  </span>
                )}
                {product.content.resource_list && product.content.resource_list.length > 0 && (
                  <span className='flex items-center gap-1'>
                    <Paperclip className='h-3 w-3 opacity-60' />
                    {product.content.resource_list.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className='flex items-center justify-between mt-auto pt-5'>
          <div className='flex items-center gap-3'>{_renderPlatformIcon()}</div>

          {product.views !== undefined && (
            <div className='flex items-center gap-2 text-[13px]'>
              <span className='flex items-center gap-1 text-slate-400'>
                <Eye className='h-6 w-6 opacity-70' />
                {product.views.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Infinite Scroll Trigger Component
const InfiniteScrollTrigger = ({ hasNextPage, isFetchingNextPage, fetchNextPage }: any) => {
  const { targetRef, isIntersecting } = useIntersectionObserver();

  if (isIntersecting && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  if (!hasNextPage) return null;

  return (
    <div ref={targetRef} className='flex justify-center pt-8 pb-4'>
      {isFetchingNextPage ? (
        <div className='flex items-center gap-2 px-4 py-2 text-sm text-slate-400'>
          <Loader2 className='h-4 w-4 animate-spin' /> Loading more...
        </div>
      ) : (
        <div className='h-10' /> // Empty space for observer
      )}
    </div>
  );
};

const getAccountName = (acc?: SocialMedia) => getSocialMediaDisplayName(acc);
const getAccountAvatar = (acc?: SocialMedia) => getSocialMediaAvatar(acc);
const PRODUCT_TABS = new Set(['published', 'scheduled', 'drafts', 'failed']);

export default function Product() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const userCoin = useUserCoins();
  const currentUser = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const tabParam = searchParams.get('status') ?? searchParams.get('tab');
  const activeTab = tabParam && PRODUCT_TABS.has(tabParam) ? tabParam : 'published';

  const [filters, setFilters] = useState<PostFilters>({});
  const [accounts, setAccounts] = useState<SocialMedia[]>([]);
  const [isAiRecommendationDialogOpen, setIsAiRecommendationDialogOpen] = useState(false);
  const [isAiRecommendationTutorialDismissed, setIsAiRecommendationTutorialDismissed] = useState(false);
  const [dontShowAiRecommendationTutorial, setDontShowAiRecommendationTutorial] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Post | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Post | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isInsufficientOpen, setIsInsufficientOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { mutate: createPostMutation, isPending: isCreatingPost } = useMutation({
    mutationFn: (payload: CreatePostPayload) => createPost(payload),
    onSuccess: (data) => {
      toast.success('Post created successfully');
      if (data.value?.id) {
        navigate(`/workspace/${workspaceId}/product/${data.value?.id}/edit`);
      }
    },
    onError: (error: any) => {
      console.log('🚀 ~ Product ~ error:', error);
      toast.error('Failed to create post', {
        description: error.message
      });
    }
  });

  const { mutate: markTutorialStep2Complete, isPending: isMarkingTutorialStep2 } = useMutation({
    mutationFn: () => completeTutorialStep(2),
    onSuccess: (data) => {
      if (data.value) {
        queryClient.setQueryData(AUTH_QUERY_KEYS.me(), data);
        setUser(data.value);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete post', {
        description: error.message
      });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: (postId: string) => unpublishPost(postId),
    onSuccess: () => {
      toast.success('Post unpublished successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error('Failed to unpublish post', {
        description: error.message
      });
    }
  });

  const unpublishMeAiFeedMutation = useMutation({
    mutationFn: (postId: string) => unpublishMeAiFeedPost(postId),
    onSuccess: () => {
      toast.success('Post unpublished successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error('Failed to unpublish post', {
        description: error.message
      });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: Partial<any> }) => updatePost(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const editPublishedMutation = useMutation({
    mutationFn: ({ postId, content, hashtag }: { postId: string; content: string; hashtag: string | null }) =>
      updatePublishedPost(postId, { content, hashtag }),
    onSuccess: () => {
      toast.success('Post updated successfully');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update post', {
        description: error.message
      });
    }
  });

  const postQueryFilters = useMemo<PostFilters>(
    () => ({
      ...filters,
      workspaceId: workspaceId ?? undefined,
      status: activeTab === 'failed' ? 'failed' : undefined
    }),
    [activeTab, filters, workspaceId]
  );

  const { postsByStatus, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage, showSkeleton } =
    usePosts(postQueryFilters);

  // Fetch accounts for the filter
  const { data: accountsData } = useQuery({
    queryKey: ['social-medias'],
    queryFn: () => fetchSocialMedias()
  });

  const { data: facebookPagesData } = useQuery({
    queryKey: ['social-medias-facebook-pages'],
    queryFn: () => fetchFacebookPages()
  });

  useEffect(() => {
    if (accountsData?.value) {
      setAccounts(mergeFacebookPagesWithAccounts(accountsData.value, facebookPagesData?.value ?? null));
    }
  }, [accountsData, facebookPagesData]);

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [queryClient]);

  const updateFilter = (key: keyof PostFilters, value: string | undefined) => {
    setFilters((prev: PostFilters) => ({ ...prev, [key]: value }));
  };

  const handleDelete = useCallback((product: Post) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(
    (product: Post) => {
      if (product.status === 'published') {
        const hasMeAiFeedPublication = product.publications?.some((pub) => pub.socialMediaType === 'meai_feed');
        const hasTikTokPublication = product.publications?.some((pub) => pub.socialMediaType === 'tiktok');

        if (hasMeAiFeedPublication) {
          unpublishMeAiFeedMutation.mutate(product.id, {
            onSuccess: () => {
              setIsDeleteDialogOpen(false);
              setDeletingProduct(null);
            }
          });
          return;
        }

        if (hasTikTokPublication) {
          toast.error('TikTok posts cannot be unpublished from this screen.');
          return;
        }

        unpublishMutation.mutate(product.id, {
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setDeletingProduct(null);
          }
        });
        return;
      }

      deleteMutation.mutate(product.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setDeletingProduct(null);
        }
      });
    },
    [deleteMutation, unpublishMutation, unpublishMeAiFeedMutation]
  );

  const handleConfirmCancelSchedule = useCallback(
    (product: Post) => {
      // call update to set status -> draft then navigate to edit
      updatePostMutation.mutate(
        { postId: product.id, payload: { status: 'draft' } },
        {
          onSuccess: () => {
            setIsScheduleDialogOpen(false);
            setViewingProduct(null);
            navigate(`/workspace/${workspaceId}/product/${product.id}/edit`);
          }
        }
      );
    },
    [updatePostMutation, navigate, workspaceId]
  );

  const handleConvertToDraft = useCallback(
    (product: Post) => {
      updatePostMutation.mutate(
        { postId: product.id, payload: { status: 'draft' } },
        {
          onSuccess: () => {
            toast.success('Post reverted to draft successfully');
          },
          onError: (error: any) => {
            toast.error('Failed to revert post to draft', {
              description: error.message
            });
          }
        }
      );
    },
    [updatePostMutation]
  );

  const handleView = useCallback(
    (product: Post) => {
      const status = product.status || 'failed';
      const aiImproveStatus = product.aiImproveStatus?.toLowerCase() ?? null;
      const isAiImproveRunning = (aiImproveStatus === 'submitted' || aiImproveStatus === 'processing') && status !== 'failed';
      const isAiRecommendationRunning = product.isAiRecommendedDraft && !product.isAiRecommendationDone && status !== 'failed';

      if (status === 'failed') {
        return;
      } else if (status === 'published') {
        navigate(`/workspace/${workspaceId}/product/${product.id}/analytics`);
      } else if (isAiRecommendationRunning || (status === 'draft' && product.isAiRecommendedDraft && !product.isAiRecommendationDone)) {
        navigate(`/workspace/${workspaceId}/product/ai-recommendation/${product.id}`);
      } else if (isAiImproveRunning) {
        navigate(`/workspace/${workspaceId}/product/${product.id}/edit`);
      } else {
        setViewingProduct(product);
        setIsViewDialogOpen(true);
      }
    },
    [navigate, workspaceId]
  );

  const handleEdit = useCallback(
    (product: Post) => {
      if (product.status === 'failed') return;

      if (product.status === 'draft') {
        if (product.isAiRecommendedDraft && !product.isAiRecommendationDone) {
          navigate(`/workspace/${workspaceId}/product/ai-recommendation/${product.id}`);
        } else {
          navigate(`/workspace/${workspaceId}/product/${product.id}/edit`);
        }
        return;
      }

      if (product.status === 'scheduled') {
        // open schedule cancel confirm dialog
        setViewingProduct(product);
        setIsScheduleDialogOpen(true);
        return;
      }

      if (product.status === 'published') {
        setEditingProduct(product);
        setIsEditDialogOpen(true);
        return;
      }
    },
    [navigate, setEditingProduct, setIsEditDialogOpen, workspaceId]
  );

  const clearFilters = () => setFilters({});

  const handleTabChange = useCallback(
    (value: string) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('tab');

      if (value === 'published') {
        nextSearchParams.delete('status');
      } else {
        nextSearchParams.set('status', value);
      }

      setSearchParams(nextSearchParams);
    },
    [searchParams, setSearchParams]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === filters.socialMediaId),
    [accounts, filters.socialMediaId]
  );

  const PLATFORMS = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'threads', label: 'Threads' }
  ];

  const shouldShowAiRecommendationTutorial =
    activeTab === 'published' &&
    !hasActiveFilters &&
    !isAiRecommendationTutorialDismissed &&
    currentUser?.tutorialStep1Completed === true &&
    currentUser?.tutorialStep2Completed === false;

  const completeAiRecommendationTutorial = useCallback(() => {
    if (currentUser?.tutorialStep2Completed || isMarkingTutorialStep2) return;
    markTutorialStep2Complete();
  }, [currentUser?.tutorialStep2Completed, isMarkingTutorialStep2, markTutorialStep2Complete]);

  const handleAiRecommendationTutorialOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsAiRecommendationTutorialDismissed(false);
        return;
      }

      setIsAiRecommendationTutorialDismissed(true);
      if (dontShowAiRecommendationTutorial) {
        completeAiRecommendationTutorial();
      }
    },
    [completeAiRecommendationTutorial, dontShowAiRecommendationTutorial]
  );

  const onAiRecommendationClick = () => {
    const balance = Number(userCoin ?? 0);

    if (balance < 100) {
      setIsInsufficientOpen(true);
      return;
    }

    if (accounts.length === 0) {
      toast.error('No social media accounts connected', {
        description: 'Please connect at least one social media account to use AI recommendations.'
      });
      return;
    }

    completeAiRecommendationTutorial();
    setIsAiRecommendationDialogOpen(true);
  };

  const renderTabContent = (posts: Post[], emptyMessage: string, emptyCta?: string, showAiSuggestion?: boolean) => {
    if (showSkeleton && posts.length === 0) {
      return (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    const shouldShowAiCard = showAiSuggestion && !hasActiveFilters;

    if (!shouldShowAiCard && posts.length === 0) {
      return <EmptyState message={emptyMessage} ctaText={emptyCta} />;
    }

    return (
      <>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {shouldShowAiCard && (
            <Popover
              open={shouldShowAiRecommendationTutorial}
              onOpenChange={handleAiRecommendationTutorialOpenChange}
            >
              <PopoverTrigger asChild>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={onAiRecommendationClick}
                  className='group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-violet-500/20 bg-[#0F0B1A] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_20px_60px_rgba(139,92,246,0.25)]'
                >
                  {/* Background Glow */}
                  <div className='absolute inset-0 bg-linear-to-br from-violet-600/10 via-transparent to-purple-600/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

                  {/* Top */}
                  <div className='relative z-10 flex items-start justify-between'>
                    <div>
                      <div className='relative flex h-12 w-12 items-center justify-center'>
                        {/* Glow */}
                        <div className='absolute inset-0 rounded-full bg-violet-500/20 blur-xl transition-all duration-500 group-hover:scale-125' />

                        {/* Icon container */}
                        <div className='relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/20'>
                          <WandSparkles className='h-5 w-5 text-white' />
                        </div>
                      </div>
                    </div>

                    {/* Optional badge */}
                    <div className='rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200'>
                      AI
                    </div>
                  </div>

                  {/* Content */}
                  <div className='relative z-10 mt-8'>
                    <h3 className='text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-violet-200'>
                      AI Recommendation
                    </h3>

                    <p className='mt-2 text-sm leading-relaxed text-slate-400'>
                      Generate smart ideas and captions for your next social post.
                    </p>
                  </div>

                  {/* Bottom Accent */}
                  <div className='absolute bottom-0 left-0 h-0.5 w-0 bg-linear-to-r from-violet-500 to-purple-500 transition-all duration-500 group-hover:w-full' />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align='start'
                side='right'
                sideOffset={12}
                className='w-80 rounded-2xl border-violet-500/20 bg-[#10111c] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.5)]'
              >
                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <p className='text-sm font-semibold text-white'>Create content immediately</p>
                    <p className='text-sm leading-relaxed text-slate-400'>
                      Use AI Recommendation to generate a ready draft for your connected pages.
                    </p>
                  </div>

                  <label className='flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300'>
                    <input
                      type='checkbox'
                      checked={dontShowAiRecommendationTutorial}
                      onChange={(event) => setDontShowAiRecommendationTutorial(event.target.checked)}
                      className='h-4 w-4 accent-violet-500'
                    />
                    Do not show again
                  </label>

                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      size='sm'
                      onClick={() => handleAiRecommendationTutorialOpenChange(false)}
                      className='rounded-xl bg-violet-600 text-white hover:bg-violet-500'
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {posts.map((product, i) => (
            <ProductCard
              key={i}
              product={product}
              onDelete={handleDelete}
              onView={handleView}
              onEdit={handleEdit}
              onConvertToDraft={handleConvertToDraft}
            />
          ))}
        </div>
        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </>
    );
  };

  const onCreateNewDraft = () => {
    const payload: CreatePostPayload = {
      workspaceId: workspaceId ?? null,
      socialMediaId: null,
      status: 'draft',
      title: '',
      chatSessionId: null,
      platform: null,
      postBuilderId: null,
      content: {
        content: '',
        hashtag: null,
        post_type: 'post',
        resource_list: []
      }
    };
    createPostMutation(payload);
  };

  return (
    <div className='relative overflow-x-hidden'>
      <div className='space-y-8'>
        {/* Header Section */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <Package className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Products</h1>
              <p className='text-sm leading-relaxed text-slate-400'>
                Manage your products from draft to published with insights.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {activeTab.toLowerCase() === 'drafts' && (
              <Button
                variant='outline'
                size={'lg'}
                className='rounded-2xl text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:text-white px-6 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 border-none transition-all active:scale-95'
                onClick={onCreateNewDraft}
              >
                {isCreatingPost ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <PackagePlusIcon className='h-4 w-4' />
                    New Draft Product
                  </>
                )}
              </Button>
            )}
            <Button
              variant='outline'
              size={'lg'}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
              onClick={() => void handleRefresh()}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-8'>
            <TabsList className='h-auto bg-transparent p-0 flex flex-wrap sm:flex-nowrap gap-1 w-full lg:w-auto'>
              <TabsTrigger
                value='published'
                className='rounded-xl px-6 py-4 text-sm font-semibold transition-all data-[state=active]:bg-emerald-500/10! data-[state=active]:border-emerald-500/20! data-[state=active]:text-emerald-400! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <Globe className='mr-2.5 h-4 w-4' />
                Published
              </TabsTrigger>
              <TabsTrigger
                value='scheduled'
                className='rounded-xl px-6 py-4 text-sm font-semibold transition-all data-[state=active]:bg-blue-500/10! data-[state=active]:border-blue-500/20! data-[state=active]:text-blue-400! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <Clock className='mr-2.5 h-4 w-4' />
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value='drafts'
                className='rounded-xl px-6 py-4 text-sm font-semibold transition-all data-[state=active]:bg-white/10! data-[state=active]:border-white/15! data-[state=active]:text-white/70! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <FileText className='mr-2.5 h-4 w-4' />
                Drafts
              </TabsTrigger>
              <TabsTrigger
                value='failed'
                className='rounded-xl px-6 py-4 text-sm font-semibold transition-all data-[state=active]:bg-rose-500/10! data-[state=active]:border-rose-500/20! data-[state=active]:text-rose-400! data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <AlertCircle className='mr-2.5 h-4 w-4' />
                Failed
              </TabsTrigger>
            </TabsList>

            <div className='flex items-center gap-2'>
              {/* Platform Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className='flex items-center gap-2.5 px-5 py-1.75 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 group'>
                    {filters.platform ? (
                      <span className='flex items-center gap-2 capitalize'>
                        <img
                          src={`/icons/platforms/${filters.platform}.svg`}
                          className='h-4 w-4'
                          alt=''
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        {filters.platform}
                      </span>
                    ) : (
                      <>
                        <Filter className='h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity' />
                        Platforms
                      </>
                    )}
                    <ChevronDown className='h-3.5 w-3.5 opacity-30 group-hover:opacity-60 transition-opacity' />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align='end'
                  className='w-56 rounded-[28px] p-2 bg-[#0a0d1a]/98 backdrop-blur-2xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200'
                >
                  <div className='space-y-1'>
                    <button
                      onClick={() => updateFilter('platform', undefined)}
                      className='flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all'
                    >
                      All Platforms
                      {!filters.platform && <Check className='h-4 w-4 text-emerald-500' />}
                    </button>
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateFilter('platform', p.id)}
                        className='flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all'
                      >
                        <span className='flex items-center gap-2.5'>
                          <div className='p-1 rounded-md bg-white/5'>
                            <img
                              src={`/icons/platforms/${p.id}.svg`}
                              className='h-4 w-4'
                              alt=''
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          {p.label}
                        </span>
                        {filters.platform === p.id && <Check className='h-4 w-4 text-emerald-500' />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Account Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className='flex items-center gap-2.5 px-5 py-1.75 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 group'>
                    {selectedAccount ? (
                      <span className='flex items-center gap-2 truncate max-w-35'>
                        <Avatar className='h-5 w-5 border border-white/10'>
                          <AvatarImage src={getAccountAvatar(selectedAccount)} />
                          <AvatarFallback className='text-[8px] bg-white/5'>
                            {getAccountName(selectedAccount).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {getAccountName(selectedAccount)}
                      </span>
                    ) : (
                      <>
                        <Archive className='h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity' />
                        Accounts
                      </>
                    )}
                    <ChevronDown className='h-3.5 w-3.5 opacity-30 group-hover:opacity-60 transition-opacity' />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align='end'
                  className='w-64 rounded-[28px] p-2 bg-[#0a0d1a]/98 backdrop-blur-2xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200'
                >
                  <div className='space-y-1 max-h-80 overflow-y-auto custom-scrollbar'>
                    <button
                      onClick={() => updateFilter('socialMediaId', undefined)}
                      className='flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all'
                    >
                      All Accounts
                      {!filters.socialMediaId && <Check className='h-4 w-4 text-emerald-500' />}
                    </button>
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => updateFilter('socialMediaId', acc.id)}
                        className='flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all'
                      >
                        <span className='flex items-center gap-3 truncate'>
                          <Avatar className='h-6 w-6 border border-white/10'>
                            <AvatarImage src={getAccountAvatar(acc)} />
                            <AvatarFallback className='text-[10px] bg-white/5 font-bold'>
                              {getAccountName(acc).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className='truncate font-medium'>{getAccountName(acc)}</span>
                        </span>
                        {filters.socialMediaId === acc.id && <Check className='h-4 w-4 text-emerald-500' />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className='flex items-center flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500'>
              {filters.platform && (
                <div className='flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[12px] font-bold text-emerald-400 uppercase tracking-wider'>
                  <Globe className='h-3.5 w-3.5' />
                  {PLATFORMS.find((p) => p.id === filters.platform)?.label}
                  <button
                    onClick={() => updateFilter('platform', undefined)}
                    className='ml-1.5 hover:text-white transition-colors'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>
              )}
              {filters.socialMediaId && (
                <div className='flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[12px] font-bold text-blue-400 uppercase tracking-wider'>
                  <Archive className='h-3.5 w-3.5' />
                  {getAccountName(selectedAccount)}
                  <button
                    onClick={() => updateFilter('socialMediaId', undefined)}
                    className='ml-1.5 hover:text-white transition-colors'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>
              )}
              <button
                onClick={clearFilters}
                className='px-4 py-2 text-[12px] font-bold text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-widest'
              >
                Clear all
              </button>
            </div>
          )}

          <TabsContent value='published' className='mt-0 outline-none'>
            {renderTabContent(
              postsByStatus.published,
              'You haven’t published any content yet.',
              'Create First Post',
              true
            )}
          </TabsContent>
          <TabsContent value='scheduled' className='mt-0 outline-none'>
            {renderTabContent(postsByStatus.scheduled, 'No content scheduled for the future.', 'Schedule Content')}
          </TabsContent>
          <TabsContent value='drafts' className='mt-0 outline-none'>
            {renderTabContent(postsByStatus.drafts, 'Your workspace is clean. Start brainstorming!', 'New Draft')}
          </TabsContent>
          <TabsContent value='failed' className='mt-0 outline-none'>
            {renderTabContent(postsByStatus.failed, 'All systems go. No failed content found.')}
          </TabsContent>
        </Tabs>
      </div>

      <DialogAiRecommendationRequest
        open={isAiRecommendationDialogOpen}
        accounts={accounts}
        defaultSocialMediaId={selectedAccount?.id || accounts[0]?.id}
        workspaceId={workspaceId}
        onOpenChange={setIsAiRecommendationDialogOpen}
      />

      <ProductViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        product={viewingProduct}
        onEdit={(product) => {
          setIsViewDialogOpen(false);
          handleEdit(product);
        }}
      />

      <ProductDeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeletingProduct(null);
        }}
        product={deletingProduct}
        isLoading={deleteMutation.isPending || unpublishMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      <ProductScheduleConfirmDialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          setIsScheduleDialogOpen(open);
          if (!open) setViewingProduct(null);
        }}
        product={viewingProduct}
        isLoading={updatePostMutation.isPending}
        onConfirm={handleConfirmCancelSchedule}
      />

      <EditPublishedPostDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={(postId, content, hashtag) => {
          editPublishedMutation.mutate({ postId, content, hashtag });
        }}
        isLoading={editPublishedMutation.isPending}
      />

      <DialogInsufficientCoins
        isOpen={isInsufficientOpen}
        onClose={() => setIsInsufficientOpen(false)}
        requiredCoins={100}
        currentBalance={Number(useUserStore.getState().user?.meAiCoin ?? 0)}
        message={'AI Recommendation requires 100 MeAI coins.'}
      />

      {/* Required for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
