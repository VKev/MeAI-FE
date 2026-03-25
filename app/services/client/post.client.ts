import type { 
  Post, 
  PostsResponse, 
  SinglePostResponse,
  BooleanResponse, 
  PlatformPostsResponse, 
  PlatformPostAnalyticsResponse, 
  PublishPostResponse 
} from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';

function getErrorMessage(
  response: PostsResponse | SinglePostResponse | BooleanResponse | PlatformPostsResponse | PlatformPostAnalyticsResponse | PublishPostResponse,
  fallback: string
) {
  return response.error?.description || fallback;
}

export async function fetchPosts(
  params?: { cursorCreatedAt?: string; cursorId?: string; limit?: number },
  signal?: AbortSignal
) {
  const queryParams = { limit: params?.limit || 12, ...params };
  const response = await clientFetch<PostsResponse>(
    '/api/Ai/posts',
    {
      method: 'GET',
      params: queryParams,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load posts.'));
  }

  return response;
}

export async function fetchWorkspacePosts(
  workspaceId: string, 
  params?: { cursorCreatedAt?: string; cursorId?: string; limit?: number },
  signal?: AbortSignal
) {
  const queryParams = { limit: params?.limit || 12, ...params };
  const response = await clientFetch<PostsResponse>(
    `/api/Ai/posts/workspace/${workspaceId}`,
    {
      method: 'GET',
      params: queryParams,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load workspace posts.'));
  }

  return response;
}

export async function fetchPostById(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<SinglePostResponse>(
    `/api/Ai/posts/${postId}`,
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load post details.'));
  }

  return response;
}

export type CreatePostPayload = {
  workspaceId: string | null;
  socialMediaId: string | null;
  title: string | null;
  content: {
    content: string | null;
    hashtag: string | null;
    resource_list: string[];
    post_type: string | null;
  };
  status: string | null;
};

export async function createPost(payload: CreatePostPayload, signal?: AbortSignal) {
  const response = await clientFetch<SinglePostResponse>(
    '/api/Ai/posts',
    {
      method: 'POST',
      data: payload,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to create post.'));
  }

  return response;
}

export async function updatePost(postId: string, payload: Partial<CreatePostPayload>, signal?: AbortSignal) {
  const response = await clientFetch<SinglePostResponse>(
    `/api/Ai/posts/${postId}`,
    {
      method: 'PUT',
      data: payload,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to update post.'));
  }

  return response;
}

export async function deletePost(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<BooleanResponse>(
    `/api/Ai/posts/${postId}`,
    {
      method: 'DELETE',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to delete post.'));
  }

  return response;
}

export async function publishPost(payload: { postId: string; socialMediaId?: string; isPrivate?: boolean | null }, signal?: AbortSignal) {
  const response = await clientFetch<PublishPostResponse>(
    '/api/Ai/posts/publish',
    {
      method: 'POST',
      data: payload,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to publish post.'));
  }

  return response;
}

export async function fetchPlatformPosts(socialMediaId: string, cursor: string = '', limit: number = 10, signal?: AbortSignal) {
  const response = await clientFetch<PlatformPostsResponse>(
    `/api/Ai/posts/social/${socialMediaId}/platform-posts`,
    {
      method: 'GET',
      params: { cursor, limit },
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load platform posts.'));
  }

  return response;
}

export async function fetchPlatformPostAnalytics(socialMediaId: string, platformPostId: string, refresh: boolean = false, signal?: AbortSignal) {
  const response = await clientFetch<PlatformPostAnalyticsResponse>(
    `/api/Ai/posts/social/${socialMediaId}/platform-posts/${platformPostId}/analytics`,
    {
      method: 'GET',
      params: { refresh },
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load post analytics.'));
  }

  return response;
}
