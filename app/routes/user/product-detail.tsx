import PostDetailView from '@/components/post/PostDetailView';

import { fetchPostById, fetchPlatformPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
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
    () => post?.publications?.filter((pub) => pub.externalContentId) ?? [],
    [post?.publications]
  );

  const { analyticsMap, isLoadingAnalytics } = useQueries({
    queries: publications.map((pub) => ({
      queryKey: ['post-analytics', pub.socialMediaId, pub.externalContentId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchPlatformPostAnalytics(pub.socialMediaId, pub.externalContentId!, false, signal),
      enabled: !!post,
      retry: 1
    })),
    combine: (results) => ({
      analyticsMap: results.reduce<Record<string, PlatformPostAnalyticsValue>>((map, result, index) => {
        if (result.data?.value) {
          map[publications[index].socialMediaId] = result.data.value;
        }
        return map;
      }, {}),
      isLoadingAnalytics: results.some((r) => r.isLoading)
    })
  });

  const handleRefreshAnalytics = useCallback(
    (socialMediaId: string, platformPostId: string) => {
      void fetchPlatformPostAnalytics(socialMediaId, platformPostId, true)
        .then((response) => {
          queryClient.setQueryData(['post-analytics', socialMediaId, platformPostId], response);
        })
        .catch(() => undefined);

      void queryClient.invalidateQueries({
        queryKey: ['post-analytics', socialMediaId, platformPostId]
      });
    },
    [queryClient]
  );

  return (
    <>
      <div className='space-y-6'>
        <section className='overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8 relative flex items-center justify-between'>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none' />

          <div className='flex items-center gap-4 relative z-10'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <Package className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Product Analytics</h1>
              <p className='text-sm leading-relaxed text-slate-400'>View the analytics for this product.</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              // onClick={handleRefresh}
              // disabled={isFetching}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white px-6 relative z-10'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${false ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </section>

        <Breadcrumb>
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
              <BreadcrumbPage>{post?.id}</BreadcrumbPage>
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
    </>
  );
}
