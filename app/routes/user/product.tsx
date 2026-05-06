import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Archive,
  Calendar,
  Eye,
  Globe,
  MoreVertical,
  Package,
  RefreshCcw,
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
  WandSparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { STATUS_CONFIG, type PostStatus } from './product-config';
import { cn } from '@/lib/utils';
import type { Post } from '@/models/post.model';
import { usePosts } from './hooks/usePosts';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
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
import { fetchSocialMedias } from '@/services/client/social-media.client';
import { deletePost } from '@/services/client/post.client';
import type { SocialMedia } from '@/models/social-media.model';
import type { PostFilters } from './hooks/usePosts';

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
  <div className='relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-5 h-[280px] animate-pulse'>
    <div className='mb-4 h-[120px] w-full rounded-2xl bg-white/5' />
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

const EmptyState = ({ message, ctaText }: { message: string, ctaText?: string }) => (
  <div className='flex flex-col items-center justify-center py-24 text-center space-y-6'>
    <div className='flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 shadow-inner'>
      <Inbox className='h-12 w-12 text-slate-500/50' />
    </div>
    <div className='space-y-2 max-w-sm'>
      <p className='text-xl font-semibold text-white'>No products found</p>
      <p className='text-sm text-slate-400'>{message}</p>
    </div>
    {ctaText && (
      <button
        className='px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm font-medium transition-all'
        onClick={() => {
          // Navigate to creation flow
          // navigate('/user/post-builder/new');
        }}
      >
        {ctaText}
      </button>
    )}
  </div>
);

const ProductCard = ({ product, onDelete }: { product: Post, onDelete: (id: string) => void }) => {
  const navigate = useNavigate();
  const status = (product.status as PostStatus) || 'draft';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const isProcessing = status === 'processing';

  return (
    <div className={cn(
      'group relative flex flex-col overflow-hidden rounded-[2rem] border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.03)]',
      isProcessing ? 'border-amber-500/30' : 'border-white/10 hover:border-white/20'
    )}>
      {/* Animated shimmer for processing state */}
      {isProcessing && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}

      {/* Preview Zone (16:9) */}
      <div className='relative z-10 aspect-video w-full bg-[#080a12] overflow-hidden'>
        {/* Actual Image if available */}
        {product.media && product.media.length > 0 && product.media[0].presignedUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={product.media[0].presignedUrl}
              alt={product.title || 'Post thumbnail'}
              className="h-full w-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a12] via-[#080a12]/40 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]" />
        )}

        <div className='relative z-10 flex items-start justify-between p-4'>
          {/* Status Badge */}
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide backdrop-blur-xl transition-all duration-300', config.className, isProcessing && 'animate-pulse')}>
            <config.icon className={cn('h-3 w-3', isProcessing && 'animate-spin')} />
            {config.label.toUpperCase()}
          </div>

          {/* Action Menu — hidden during processing */}
          {!isProcessing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10 backdrop-blur-md'>
                  <MoreVertical className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0a0d1a]/95 backdrop-blur-xl border-white/10 text-slate-300">
                {(status === 'draft' || status === 'scheduled') && (
                  <DropdownMenuItem
                    className="hover:bg-white/5 hover:text-white cursor-pointer py-2"
                    onClick={() => {
                      // Navigate to Post Builder for editing
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                )}

                {(status === 'failed' || status === 'unpublishing') && (
                  <>
                    <DropdownMenuItem
                      className="hover:bg-white/5 hover:text-white cursor-pointer py-2"
                      onClick={() => {
                        // Navigate to Product Detail
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {status === 'failed' && (
                      <DropdownMenuItem
                        className="hover:bg-white/5 hover:text-white cursor-pointer py-2 text-emerald-400"
                        onClick={() => {
                          // Implement Retry Publish logic
                        }}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" /> Retry Publish
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {status === 'published' && (
                  <>
                    <DropdownMenuItem
                      className="hover:bg-white/5 hover:text-white cursor-pointer py-2"
                      onClick={() => {
                        // Navigate to Analytics
                      }}
                    >
                      <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer py-2"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post?')) {
                      onDelete(product.id);
                    }
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className='relative z-10 flex flex-col flex-1 p-5'>
        <div className='space-y-1.5 mb-6 flex-1'>
          <h3 className='font-semibold text-white/90 line-clamp-2 group-hover:text-white transition-colors leading-snug'>
            {product.title || 'Untitled Product'}
          </h3>

          <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5'>
            <p className='text-[13px] text-slate-400 flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5 opacity-70' />
              {status === 'scheduled' && product.schedule?.scheduledAtUtc
                ? `Scheduled for ${new Date(product.schedule.scheduledAtUtc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : formatRelativeDate(product.createdAt)
              }
            </p>

            {/* Metadata Indicators */}
            {product.content && (
              <div className='flex items-center gap-3 text-[12px] text-slate-500'>
                {product.content.hashtag && (
                  <span className='flex items-center gap-1'>
                    <Hash className='h-3 w-3 opacity-60' />
                    {product.content.hashtag.split(' ').filter(h => h.startsWith('#')).length}
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
          <div className='flex items-center gap-3'>
            {product.publications && product.publications.length > 0 ? (
              <div className="flex items-center">
                <PlatformStack publications={product.publications} />
              </div>
            ) : (
              <span className='text-[11px] text-slate-500 font-medium uppercase tracking-wider'>No platforms</span>
            )}

            {/* Subtle Owner Info */}
            {product.workspaceId && product.username && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-white/10 group-hover:border-white/20 transition-colors">
                <Avatar className="h-4 w-4 border border-white/5 ring-1 ring-white/5">
                  <AvatarImage src={product.avatarUrl || ''} />
                  <AvatarFallback className="text-[6px] bg-white/5 text-slate-400">{product.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors truncate max-w-[60px] font-medium">{product.username}</span>
              </div>
            )}
          </div>

          {product.views !== undefined && (
            <div className='flex items-center gap-2 text-[13px]'>
              <span className='flex items-center gap-1 text-slate-400'>
                <Eye className='h-3.5 w-3.5 opacity-70' />
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

const getAccountName = (acc?: SocialMedia) => acc?.profile?.username || acc?.profile?.pageName || acc?.profile?.displayName || 'Unknown';
const getAccountAvatar = (acc?: SocialMedia) => acc?.profile?.profilePictureUrl || acc?.profile?.pageProfilePictureUrl || '';

export default function Product() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PostFilters>({});
  const [accounts, setAccounts] = useState<SocialMedia[]>([]);

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

  const {
    postsByStatus,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    showSkeleton
  } = usePosts(filters);

  // Fetch accounts for the filter
  const { data: accountsData } = useQuery({
    queryKey: ['social-medias'],
    queryFn: fetchSocialMedias,
  });

  useEffect(() => {
    if (accountsData?.value) {
      setAccounts(accountsData.value);
    }
  }, [accountsData]);

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [queryClient]);

  const updateFilter = (key: keyof PostFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({});

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const selectedAccount = useMemo(() =>
    accounts.find(a => a.id === filters.socialMediaId),
    [accounts, filters.socialMediaId]
  );

  const PLATFORMS = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'threads', label: 'Threads' },
  ];

  const renderTabContent = (posts: Post[], emptyMessage: string, emptyCta?: string, showAiSuggestion?: boolean) => {
    if (showSkeleton && posts.length === 0) {
      return (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    const shouldShowAiCard = showAiSuggestion && !hasActiveFilters;

    if (posts.length === 0 && !shouldShowAiCard) {
      return <EmptyState message={emptyMessage} ctaText={emptyCta} />;
    }

    return (
      <>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {shouldShowAiCard && (
            <div
              className="group relative flex flex-col items-start justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] p-6 transition-all duration-500 hover:border-amber-500/30 hover:bg-white/[0.05] cursor-pointer min-h-[280px] shadow-2xl"
              onClick={() => {
                // Navigate to AI Suggestion
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-xl border-amber-400/20 bg-amber-500/10 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.1)] group-hover:scale-110 transition-transform duration-500">
                <WandSparkles className="h-6 w-6" />
              </div>
              <div className="mt-auto space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold text-white group-hover:text-amber-400 transition-colors">AI Suggestion</h3>
                </div>
                <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                  Generate ideas for your next post
                </p>
              </div>

              {/* Subtle glass effect at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          {posts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={(id) => deleteMutation.mutate(id)}
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

  return (
    <div className='relative min-h-screen py-6 sm:py-8 overflow-x-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8'>
        {/* Header Section */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
          
          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <Package className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Products</h1>
              <p className='text-sm leading-relaxed text-slate-400'>
                Manage your content pipeline from draft to published with real-time insights.
              </p>
            </div>
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={handleRefresh}
            disabled={isFetching}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </section>

        <Tabs defaultValue='published' className='w-full'>
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-[#080a12]/40 p-2 rounded-[1.5rem] border border-white/5 backdrop-blur-xl'>
            <TabsList className='h-auto bg-transparent p-0 flex flex-wrap sm:flex-nowrap gap-1 w-full lg:w-auto'>
              <TabsTrigger
                value='published'
                className='rounded-xl px-6 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <Globe className='mr-2.5 h-4 w-4' />
                Published
              </TabsTrigger>
              <TabsTrigger
                value='scheduled'
                className='rounded-xl px-6 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <Clock className='mr-2.5 h-4 w-4' />
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value='drafts'
                className='rounded-xl px-6 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <FileText className='mr-2.5 h-4 w-4' />
                Drafts
              </TabsTrigger>
              <TabsTrigger
                value='failed'
                className='rounded-xl px-6 py-3 text-sm font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 whitespace-nowrap flex-1 sm:flex-none'
              >
                <AlertCircle className='mr-2.5 h-4 w-4' />
                Failed
              </TabsTrigger>
            </TabsList>

            <div className='flex items-center gap-2 px-1'>
              {isFetching && !isFetchingNextPage && (
                <div className="flex items-center gap-2 mr-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 animate-pulse bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Syncing
                </div>
              )}

              {/* Platform Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className='flex items-center gap-2.5 px-5 py-3 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 group'>
                    {filters.platform ? (
                      <span className='flex items-center gap-2 capitalize'>
                        <img src={`/icons/platforms/${filters.platform}.svg`} className="h-4 w-4" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
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
                <PopoverContent align="end" className="w-56 p-2 bg-[#0a0d1a]/98 backdrop-blur-2xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="space-y-1">
                    <button
                      onClick={() => updateFilter('platform', undefined)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                    >
                      All Platforms
                      {!filters.platform && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateFilter('platform', p.id)}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <div className="p-1 rounded-md bg-white/5">
                            <img src={`/icons/platforms/${p.id}.svg`} className="h-4 w-4" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                          {p.label}
                        </span>
                        {filters.platform === p.id && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Account Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className='flex items-center gap-2.5 px-5 py-3 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 group'>
                    {selectedAccount ? (
                      <span className='flex items-center gap-2 truncate max-w-[140px]'>
                        <Avatar className="h-5 w-5 border border-white/10">
                          <AvatarImage src={getAccountAvatar(selectedAccount)} />
                          <AvatarFallback className="text-[8px] bg-white/5">{getAccountName(selectedAccount).charAt(0)}</AvatarFallback>
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
                <PopoverContent align="end" className="w-64 p-2 bg-[#0a0d1a]/98 backdrop-blur-2xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="space-y-1 max-h-[20rem] overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => updateFilter('socialMediaId', undefined)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                    >
                      All Accounts
                      {!filters.socialMediaId && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => updateFilter('socialMediaId', acc.id)}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                      >
                        <span className="flex items-center gap-3 truncate">
                          <Avatar className="h-6 w-6 border border-white/10">
                            <AvatarImage src={getAccountAvatar(acc)} />
                            <AvatarFallback className="text-[10px] bg-white/5 font-bold">{getAccountName(acc).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium">{getAccountName(acc)}</span>
                        </span>
                        {filters.socialMediaId === acc.id && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex items-center flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              {filters.platform && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[12px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Globe className="h-3.5 w-3.5" />
                  {PLATFORMS.find(p => p.id === filters.platform)?.label}
                  <button onClick={() => updateFilter('platform', undefined)} className="ml-1.5 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {filters.socialMediaId && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[12px] font-bold text-blue-400 uppercase tracking-wider">
                  <Archive className="h-3.5 w-3.5" />
                  {getAccountName(selectedAccount)}
                  <button onClick={() => updateFilter('socialMediaId', undefined)} className="ml-1.5 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-[12px] font-bold text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-widest"
              >
                Clear all
              </button>
            </div>
          )}

          <TabsContent value='published' className='mt-0 outline-none'>
            {renderTabContent(postsByStatus.published, 'You haven’t published any content yet.', 'Create First Post', true)}
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
