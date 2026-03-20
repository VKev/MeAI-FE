import { mockUserPosts } from '@/data/mock-posts';
import type { PostCursor, PostsResponse } from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';
import type { Post } from '@/models/post.model';

type FetchPostsParams = {
  limit?: number;
  cursor?: PostCursor;
  signal?: AbortSignal;
  useMock?: boolean;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

function buildSearchParams(params: FetchPostsParams) {
  const limit = normalizeLimit(params.limit);
  const searchParams = new URLSearchParams({ limit: String(limit) });

  if (params.cursor?.cursorCreatedAt && params.cursor?.cursorId) {
    searchParams.set('cursorCreatedAt', params.cursor.cursorCreatedAt);
    searchParams.set('cursorId', params.cursor.cursorId);
  }

  return searchParams;
}

function getErrorMessage(response: PostsResponse, fallback: string) {
  return response.error?.description || response.error?.message || fallback;
}

function comparePostsByCursor(a: Post, b: Post) {
  const createdAtA = a.createdAt ? Date.parse(a.createdAt) : Number.NEGATIVE_INFINITY;
  const createdAtB = b.createdAt ? Date.parse(b.createdAt) : Number.NEGATIVE_INFINITY;

  if (createdAtA !== createdAtB) {
    return createdAtB - createdAtA;
  }

  return b.id.localeCompare(a.id);
}

function paginateMockPosts(posts: Post[], params: FetchPostsParams): PostsResponse {
  const limit = normalizeLimit(params.limit);
  const sortedPosts = [...posts].sort(comparePostsByCursor);

  let startIndex = 0;

  if (params.cursor?.cursorCreatedAt && params.cursor.cursorId) {
    const cursorIndex = sortedPosts.findIndex(
      (post) => post.createdAt === params.cursor?.cursorCreatedAt && post.id === params.cursor?.cursorId
    );

    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  return {
    isSuccess: true,
    isFailure: false,
    error: null,
    value: sortedPosts.slice(startIndex, startIndex + limit)
  };
}

export async function fetchPosts(params: FetchPostsParams = {}) {
  if (params.useMock) {
    return paginateMockPosts(mockUserPosts, params);
  }

  const searchParams = buildSearchParams(params);
  const response = await clientFetch<PostsResponse>(
    `/api/Ai/posts?${searchParams.toString()}`,
    {
      method: 'GET',
      signal: params.signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load posts.'));
  }

  return response;
}

export async function fetchWorkspacePosts(workspaceId: string, params: FetchPostsParams = {}) {
  if (params.useMock) {
    return paginateMockPosts(
      mockUserPosts.filter((post) => post.workspaceId === workspaceId),
      params
    );
  }

  const searchParams = buildSearchParams(params);
  const response = await clientFetch<PostsResponse>(
    `/api/Ai/posts/workspace/${workspaceId}?${searchParams.toString()}`,
    {
      method: 'GET',
      signal: params.signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load workspace posts.'));
  }

  return response;
}
