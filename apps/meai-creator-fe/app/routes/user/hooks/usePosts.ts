import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPosts, fetchWorkspacePosts } from '@/services/client/post.client';
import { useMemo } from 'react';
import type { Post, PostPublication } from '@/models/post.model';

const getPublishedTime = (post: Post) => {
  const publishedAt = post.publications?.[0]?.publishedAt;
  return publishedAt ? new Date(publishedAt).getTime() : 0;
};

const getScheduledTime = (post: Post) => {
  const scheduledAt = post.schedule?.scheduledAtUtc;
  return scheduledAt ? new Date(scheduledAt).getTime() : 0;
};

const getCreatedTime = (post: Post) => {
  return post.createdAt ? new Date(post.createdAt).getTime() : 0;
};

const PAGE_SIZE = 24;

export type PostFilters = {
  platform?: string;
  socialMediaId?: string;
  status?: string;
  workspaceId?: string;
};

function normalizePlatform(value: string | null | undefined) {
  const platform = value?.trim().toLowerCase() ?? '';
  return platform === 'thread' ? 'threads' : platform;
}

function publicationMatchesFilters(publication: PostPublication, filters: PostFilters) {
  if (filters.socialMediaId && publication.socialMediaId !== filters.socialMediaId) {
    return false;
  }

  if (filters.platform && normalizePlatform(publication.socialMediaType) !== normalizePlatform(filters.platform)) {
    return false;
  }

  return true;
}

function expandPublishedPostsByPublication(posts: Post[], filters: PostFilters) {
  return posts.flatMap((post) => {
    const isPublishedPost = post.isPublished || post.status === 'published';
    if (!isPublishedPost || post.publications.length === 0) {
      return [post];
    }

    return post.publications
      .filter((publication) => publicationMatchesFilters(publication, filters))
      .map((publication) => {
        const publicationStatus = publication.publishStatus?.trim().toLowerCase() || post.status;
        const isPublished = publicationStatus === 'published';

        return {
          ...post,
          socialMediaId: publication.socialMediaId,
          platform: publication.socialMediaType ?? post.platform,
          status: publicationStatus,
          isPublished,
          publications: [publication]
        };
      });
  });
}

export function usePosts(filters: PostFilters = {}) {
  const queryInfo = useInfiniteQuery({
    queryKey: ['posts', 'all', filters],
    queryFn: ({ pageParam }) =>
      filters.workspaceId
        ? fetchWorkspacePosts(filters.workspaceId, { limit: PAGE_SIZE, ...pageParam, ...filters })
        : fetchPosts({ limit: PAGE_SIZE, ...pageParam, ...filters }),
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

  const allPosts = useMemo(() => expandPublishedPostsByPublication(apiPosts, filters), [apiPosts, filters]);

  const postsByStatus = useMemo(() => {
    return {
      published: allPosts.filter(p => p.isPublished || p.status === 'published')
        .sort((a, b) => getPublishedTime(b) - getPublishedTime(a)),
      scheduled: allPosts.filter(p => p.status === 'scheduled')
        .sort((a, b) => getScheduledTime(a) - getScheduledTime(b)),
      failed: allPosts.filter(p => {
        const status = p.status || 'failed';
        const aiRecommendationStatus = p.aiRecommendationStatus?.toLowerCase() ?? null;
        const updatedAtTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;
        const isAiRecommendationFailed = p.isAiRecommendedDraft && (status === 'failed' || aiRecommendationStatus === 'failed' || (!p.isAiRecommendationDone && isStalled));
        return p.status === 'failed' || p.status === 'unpublishing' || isAiRecommendationFailed;
      }).sort((a, b) => getCreatedTime(b) - getCreatedTime(a)),
      drafts: allPosts.filter(p => {
        const status = p.status || 'failed';
        const aiRecommendationStatus = p.aiRecommendationStatus?.toLowerCase() ?? null;
        const updatedAtTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const isStalled = updatedAtTime > 0 && (Date.now() - updatedAtTime) > 5 * 60 * 1000;
        const isAiRecommendationFailed = p.isAiRecommendedDraft && (status === 'failed' || aiRecommendationStatus === 'failed' || (!p.isAiRecommendationDone && isStalled));
        return !p.isPublished && (p.status === null || p.status === 'draft' || p.status === 'processing') && !isAiRecommendationFailed;
      }).sort((a, b) => getCreatedTime(b) - getCreatedTime(a)),
    };
  }, [allPosts]);

  return {
    ...queryInfo,
    allPosts,
    postsByStatus,
    showSkeleton: queryInfo.isLoading || queryInfo.isFetching
  };
}
