import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  LayoutGrid,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  Copy,
  Edit,
  Trash,
  BarChart2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
  <div className='relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 h-[280px] animate-pulse'>
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
      <button className='px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm font-medium transition-all'>
        {ctaText}
      </button>
    )}
  </div>
);

const ProductCard = ({ product }: { product: Post }) => {
  const status = (product.status as PostStatus) || 'draft';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const isProcessing = status === 'processing';

  return (
    <div className={cn(
      'group relative flex flex-col overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_50%),linear-gradient(180deg,rgba(11,13,24,0.8)_0%,rgba(7,9,16,0.9)_100%)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]',
      isProcessing ? 'border-amber-500/30' : 'border-white/10 hover:border-white/20'
    )}>
      {/* Animated shimmer for processing state */}
      {isProcessing && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}

      {/* Thumbnail Area - Placeholder for future */}
      <div className='relative z-10 h-[140px] w-full bg-black/40 border-b border-white/5 overflow-hidden p-4 flex flex-col justify-between'>
        <div className='flex items-start justify-between'>
          {/* Status Badge */}
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium backdrop-blur-md', config.className, isProcessing && 'animate-pulse')}>
            <config.icon className={cn('h-3.5 w-3.5', isProcessing && 'animate-spin')} />
            {config.label}
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10 backdrop-blur-md'>
                <MoreVertical className='h-4 w-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0a0d1a]/95 backdrop-blur-xl border-white/10 text-slate-300">
              {(status === 'draft' || status === 'scheduled') && (
                <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer py-2">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              
              {(status === 'failed' || status === 'unpublishing') && (
                <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer py-2">
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
              )}

              {status === 'published' && (
                <>
                  <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer py-2">
                    <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer py-2">
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                </>
              )}

              {status !== 'processing' && (
                <>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer py-2">
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      <div className='relative z-10 flex flex-col flex-1 p-5'>
        <div className='space-y-1.5 mb-6 flex-1'>
          <h3 className='font-semibold text-white/90 line-clamp-2 group-hover:text-white transition-colors leading-snug'>
            {product.title || 'Untitled Product'}
          </h3>
          <p className='text-[13px] text-slate-400 flex items-center gap-1.5'>
            <Calendar className='h-3.5 w-3.5 opacity-70' />
            {formatRelativeDate(product.createdAt)}
          </p>
        </div>

        {/* Footer Meta */}
        <div className='flex items-center justify-between mt-auto pt-4 border-t border-white/5'>
          <div className='flex items-center gap-2'>
            {product.publications && product.publications.length > 0 ? (
              <PlatformStack publications={product.publications} />
            ) : (
              <span className='text-xs text-slate-500 font-medium'>No platforms</span>
            )}
          </div>
          
          {product.views !== undefined && (
            <div className='flex items-center gap-2 text-[13px]'>
              <span className='flex items-center gap-1 text-slate-400'>
                <Eye className='h-3.5 w-3.5 opacity-70'/> 
                {product.views.toLocaleString()}
              </span>
              {/* Mock Delta Indicator */}
              <span className='flex items-center gap-0.5 text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded'>
                <TrendingUp className='h-3 w-3' /> 12%
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

export default function Product() {
  const queryClient = useQueryClient();
  const { 
    postsByStatus, 
    isLoading, 
    isFetching, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage,
    showSkeleton 
  } = usePosts();

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [queryClient]);

  const renderTabContent = (posts: Post[], emptyMessage: string, emptyCta?: string) => {
    if (showSkeleton) {
      return (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (posts.length === 0) {
      return <EmptyState message={emptyMessage} ctaText={emptyCta} />;
    }

    return (
      <>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {posts.map((product) => <ProductCard key={product.id} product={product} />)}
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
    <div className='relative min-h-screen py-6 sm:py-8'>
      <div className='relative z-10 space-y-8'>
        {/* Header Section */}
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] relative overflow-hidden'>
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-sky-500/20" />
                <Package className='h-7 w-7 relative z-10' />
              </div>
              <div className='space-y-1'>
                <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Products</h1>
                <p className='text-sm leading-relaxed text-slate-400'>
                  Manage your content pipeline from draft to published.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className='group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-50'
              title='Refresh Page'
            >
              <RefreshCcw className={cn('h-5 w-5 transition-transform duration-500', isFetching ? 'animate-spin' : 'group-hover:rotate-180')} />
            </button>
          </div>
        </section>

        {/* Main Content Area with Advanced Tabs */}
        <Tabs defaultValue='published' className='w-full'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
            <TabsList className='h-auto border border-white/10 bg-[#080a12]/80 p-1.5 backdrop-blur-md rounded-2xl w-full sm:w-auto overflow-x-auto flex-nowrap hide-scrollbar'>
              <TabsTrigger 
                value='published' 
                className='rounded-xl px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 text-slate-400 hover:text-slate-200 whitespace-nowrap'
              >
                <Globe className='mr-2 h-4 w-4' />
                Published
              </TabsTrigger>
              <TabsTrigger 
                value='scheduled' 
                className='rounded-xl px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-300 text-slate-400 hover:text-slate-200 whitespace-nowrap'
              >
                <Clock className='mr-2 h-4 w-4' />
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value='drafts' 
                className='rounded-xl px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-slate-500/20 data-[state=active]:text-slate-200 text-slate-400 hover:text-slate-200 whitespace-nowrap'
              >
                <FileText className='mr-2 h-4 w-4' />
                Drafts
              </TabsTrigger>
              <TabsTrigger 
                value='failed' 
                className='rounded-xl px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-300 text-slate-400 hover:text-slate-200 whitespace-nowrap'
              >
                <AlertCircle className='mr-2 h-4 w-4' />
                Failed
              </TabsTrigger>
            </TabsList>

            {isFetching && !isLoading && (
              <div className='flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 shrink-0'>
                <Loader2 className='h-3 w-3 animate-spin' />
                Syncing...
              </div>
            )}
          </div>

          <TabsContent value='published' className='space-y-6 outline-none'>
            {renderTabContent(postsByStatus.published, 'You haven’t published any content yet.', 'Create First Post')}
          </TabsContent>

          <TabsContent value='scheduled' className='space-y-6 outline-none'>
            {renderTabContent(postsByStatus.scheduled, 'No content scheduled for the future.', 'Schedule Content')}
          </TabsContent>

          <TabsContent value='drafts' className='space-y-6 outline-none'>
            {renderTabContent(postsByStatus.drafts, 'Your workspace is clean. Start brainstorming!', 'New Draft')}
          </TabsContent>

          <TabsContent value='failed' className='space-y-6 outline-none'>
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
