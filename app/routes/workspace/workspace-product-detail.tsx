import PostDetailView from '@/components/post/PostDetailView';

import { fetchPostById, fetchPlatformPostAnalytics, fetchFeedPostAnalytics } from '@/services/client/post.client';
import type { PlatformPostAnalyticsValue } from '@/models/post.model';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useMemo, useCallback } from 'react';

export default function WorkspaceProductDetail() {
  const { workspaceId, postId } = useParams();
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

  const { analyticsMap, isLoadingAnalytics } = useQueries({
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
        staleTime: 5 * 60 * 1000,
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
      isLoadingAnalytics: results.some((r) => r.isLoading)
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

  return (
    <PostDetailView
      post={post as any}
      analyticsMap={analyticsMap}
      isLoadingPost={isLoadingPost}
      isLoadingAnalytics={isLoadingAnalytics}
      onBack={() => navigate(`/workspace/${workspaceId}/product`)}
      onRefreshAnalytics={handleRefreshAnalytics}
    />
  );
}
