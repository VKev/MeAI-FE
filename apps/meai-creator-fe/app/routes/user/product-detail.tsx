import PostDetailView from '@/components/post/PostDetailView';
import { fetchPostById, fetchPlatformPostAnalytics, fetchFeedPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export default function ProductDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: postData, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: ({ signal }) => fetchPostById(postId!, signal),
    enabled: Boolean(postId)
  });

  const post = postData?.value ?? null;

  const publications = useMemo(
    () => post?.publications?.filter((pub) => pub.externalContentId || pub.socialMediaType?.toLowerCase() === 'feed') ?? [],
    [post?.publications]
  );

  const { analyticsMap, isLoadingAnalytics, isFetchingAnalytics } = useQueries({
    queries: publications.map((pub) => {
      const isFeed = pub.socialMediaType?.toLowerCase() === 'feed';
      
      return {
        queryKey: isFeed 
          ? ['feed-post-analytics', post?.id] 
          : ['post-analytics', pub.socialMediaId, pub.externalContentId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          isFeed 
            ? fetchFeedPostAnalytics(post!.id, 5, signal)
            : fetchPlatformPostAnalytics(pub.socialMediaId, pub.externalContentId!, false, signal),
        enabled: !!post && (isFeed || !!pub.externalContentId),
        retry: 1
      };
    }),
    combine: (results) => ({
      analyticsMap: results.reduce<Record<string, PlatformPostAnalyticsValue>>((map, result, index) => {
        if (result.data?.value) {
          map[publications[index].socialMediaId] = result.data.value;
        }
        return map;
      }, {}),
      isLoadingAnalytics: results.some((r) => r.isLoading),
      isFetchingAnalytics: results.some((r) => r.isFetching)
    })
  });

  const handleRefreshAnalytics = useCallback(
    (socialMediaId: string, platformPostId: string) => {
      const pub = publications.find(p => p.socialMediaId === socialMediaId);
      const isFeed = pub?.socialMediaType?.toLowerCase() === 'feed';

      if (isFeed) {
        void fetchFeedPostAnalytics(post!.id)
          .then((response) => {
            queryClient.setQueryData(['feed-post-analytics', post?.id], response);
          })
          .catch(() => undefined);
          
        void queryClient.invalidateQueries({
          queryKey: ['feed-post-analytics', post?.id]
        });
        return;
      }

      void fetchPlatformPostAnalytics(socialMediaId, platformPostId, true)
        .then((response) => {
          queryClient.setQueryData(['post-analytics', socialMediaId, platformPostId], response);
        })
        .catch(() => undefined);

      void queryClient.invalidateQueries({
        queryKey: ['post-analytics', socialMediaId, platformPostId]
      });
    },
    [queryClient, publications, post?.id]
  );

  const isSyncing = isLoadingAnalytics || isFetchingAnalytics;

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
            <Package className='h-5 w-5' />
          </div>

          <div className='space-y-0.5'>
            <h1 className='text-xl font-bold tracking-tight text-white'>Product Analytics</h1>
            <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>Analytics for this product</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              if (!post) return;
              for (const pub of publications) {
                handleRefreshAnalytics(pub.socialMediaId, pub.externalContentId ?? '');
              }
            }}
            disabled={isSyncing || !post}
            className='h-10 rounded-[14px] border-none bg-white/[0.05] px-4 text-xs font-bold text-slate-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-60 disabled:hover:bg-white/[0.05]'
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </header>
      <Breadcrumb className='px-2'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/user'>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/user/product'>Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className='max-w-[200px] truncate'>{post?.title || post?.id || 'Analytics'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PostDetailView
        post={post as any}
        analyticsMap={analyticsMap}
        isLoadingPost={isLoadingPost}
        isLoadingAnalytics={isLoadingAnalytics}
        onBack={() => navigate('/user/product')}
        onRefreshAnalytics={handleRefreshAnalytics}
      />
    </div>
  );
}
