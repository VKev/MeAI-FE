import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPosts } from '@/services/client/post.client';
import { useMemo } from 'react';
import type { Post } from '@/models/post.model';

// Using mock data from product.tsx for testing
export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Summer Launch Campaign 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isPublished: true,
    status: 'published',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    views: 12400,
    publications: [
      { id: 'p1', socialMediaId: 'sm1', socialMediaType: 'facebook', publishStatus: 'published', destinationOwnerId: null, externalContentId: null, externalContentIdType: null, contentType: null, publishedAt: null, createdAt: null },
      { id: 'p2', socialMediaId: 'sm2', socialMediaType: 'instagram', publishStatus: 'published', destinationOwnerId: null, externalContentId: null, externalContentIdType: null, contentType: null, publishedAt: null, createdAt: null },
      { id: 'p3', socialMediaId: 'sm3', socialMediaType: 'tiktok', publishStatus: 'published', destinationOwnerId: null, externalContentId: null, externalContentIdType: null, contentType: null, publishedAt: null, createdAt: null },
      { id: 'p4', socialMediaId: 'sm4', socialMediaType: 'threads', publishStatus: 'published', destinationOwnerId: null, externalContentId: null, externalContentIdType: null, contentType: null, publishedAt: null, createdAt: null },
    ],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '2',
    title: 'New Product Teaser Video',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isPublished: false,
    status: 'scheduled',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: {
      scheduleGroupId: 'sg1',
      scheduledAtUtc: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      timezone: 'Asia/Ho_Chi_Minh',
      socialMediaIds: ['sm1'],
      isPrivate: false
    },
    publications: [],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '3',
    title: 'Behind the Scenes - Studio Vibe',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isPublished: false,
    status: 'processing',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    publications: [],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '4',
    title: 'Weekly Community Q&A Session',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isPublished: false,
    status: 'failed',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    publications: [],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '5',
    title: 'Draft: Influencer Partnership 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isPublished: false,
    status: null,
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    publications: [],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '6',
    title: 'Global Expansion Announcement',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    isPublished: true,
    status: 'published',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    views: 8520,
    publications: [
      { id: 'p5', socialMediaId: 'sm5', socialMediaType: 'meai_feed', publishStatus: 'published', destinationOwnerId: null, externalContentId: null, externalContentIdType: null, contentType: null, publishedAt: null, createdAt: null },
    ],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
  {
    id: '7',
    title: 'Post being removed from platforms',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isPublished: false,
    status: 'unpublishing',
    username: 'meai_user',
    avatarUrl: null,
    postBuilderId: null,
    chatSessionId: null,
    schedule: null,
    publications: [],
    userId: 'u1',
    workspaceId: 'w1',
    socialMediaId: null,
    content: null,
    media: [],
    updatedAt: null,
  },
];

const PAGE_SIZE = 24;
const DEBUG_USE_MOCK = true;

export type PostFilters = {
  platform?: string;
  socialMediaId?: string;
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
  
  const allPosts = useMemo(() => {
    let results = DEBUG_USE_MOCK || apiPosts.length === 0 ? MOCK_POSTS : apiPosts;
    
    // Client-side filtering for mock data
    if (DEBUG_USE_MOCK) {
      if (filters.platform) {
        results = results.filter(p => p.publications.some(pub => pub.socialMediaType === filters.platform));
      }
      if (filters.socialMediaId) {
        results = results.filter(p => p.socialMediaId === filters.socialMediaId || p.publications.some(pub => pub.socialMediaId === filters.socialMediaId));
      }
    }
    
    return results;
  }, [apiPosts, filters]);

  const postsByStatus = useMemo(() => {
    return {
      published: allPosts.filter(p => p.isPublished || p.status === 'published'),
      scheduled: allPosts.filter(p => p.status === 'scheduled'),
      failed: allPosts.filter(p => p.status === 'failed' || p.status === 'unpublishing'),
      drafts: allPosts.filter(p => !p.isPublished && (p.status === null || p.status === 'draft' || p.status === 'processing')),
    };
  }, [allPosts]);

  return {
    ...queryInfo,
    allPosts,
    postsByStatus,
    showSkeleton: (queryInfo.isLoading || queryInfo.isFetching) && !DEBUG_USE_MOCK
  };
}
