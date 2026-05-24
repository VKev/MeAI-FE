import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPosts } from '@/services/client/post.client';
import { useMemo } from 'react';
import type { Post } from '@/models/post.model';

const PAGE_SIZE = 24;

export type PostFilters = {
  platform?: string;
  socialMediaId?: string;
  status?: string;
};

export function usePosts(filters: PostFilters = {}) {
  const queryInfo = useInfiniteQuery({
    queryKey: ['posts', 'all', filters],
    queryFn: ({ pageParam }) => fetchPosts({ limit: PAGE_SIZE, ...pageParam, ...filters }),
    initialPageParam: { limit: PAGE_SIZE } as any,
    getNextPageParam: (lastPage) => {
      const posts = lastPage.value ?? [];
      if (posts.length < PAGE_SIZE) return undefined;
      const last = posts[posts.length - 1];
      return {
        cursorCreatedAt: last.createdAt ?? undefined,
        cursorId: last.id,
        limit: PAGE_SIZE
      };
    }
  });

  const apiPosts = useMemo(() => queryInfo.data?.pages.flatMap((page) => page.value ?? []) ?? [], [queryInfo.data]);
  
  const allPosts = apiPosts;

  const postsByStatus = useMemo(() => {
    return {
      published: allPosts.filter(p => p.isPublished || p.status === 'published'),
      scheduled: allPosts.filter(p => p.status === 'scheduled'),
      failed: allPosts.filter(p => {
        const status = p.status || 'failed';
        const aiRecommendationStatus = p.aiRecommendationStatus?.toLowerCase() ?? null;
        const updatedAtTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;
        const isAiRecommendationFailed = p.isAiRecommendedDraft && (status === 'failed' || aiRecommendationStatus === 'failed' || (!p.isAiRecommendationDone && isStalled));
        return p.status === 'failed' || p.status === 'unpublishing' || isAiRecommendationFailed;
      }),
      drafts: allPosts.filter(p => {
        const status = p.status || 'failed';
        const aiRecommendationStatus = p.aiRecommendationStatus?.toLowerCase() ?? null;
        const updatedAtTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;
        const isAiRecommendationFailed = p.isAiRecommendedDraft && (status === 'failed' || aiRecommendationStatus === 'failed' || (!p.isAiRecommendationDone && isStalled));
        return !p.isPublished && (p.status === null || p.status === 'draft' || p.status === 'processing') && !isAiRecommendationFailed;
      }),
    };
  }, [allPosts]);

  return {
    ...queryInfo,
    allPosts,
    postsByStatus,
    showSkeleton: queryInfo.isLoading || queryInfo.isFetching
  };
}
