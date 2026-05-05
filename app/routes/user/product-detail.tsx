import PostDetailView from '@/components/post/PostDetailView';

import { fetchPostById, fetchPlatformPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useMemo, useCallback } from 'react';

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
    <PostDetailView
      post={post as any}
      analyticsMap={analyticsMap}
      isLoadingPost={isLoadingPost}
      isLoadingAnalytics={isLoadingAnalytics}
      onBack={() => navigate('/user/product')}
      onRefreshAnalytics={handleRefreshAnalytics}
    />
  );
}
