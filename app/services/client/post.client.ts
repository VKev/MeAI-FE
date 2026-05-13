import type {
  Post,
  PostsResponse,
  SinglePostResponse,
  BooleanResponse,
  PlatformPostsResponse,
  PlatformPostAnalyticsResponse,
  PlatformDashboardSummaryResponse,
  BatchDashboardSummaryResponse,
  PublishPostResponse,
  PostApiError,
  AiPostImproveResponse
} from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';

function getErrorMessage(response: { error: PostApiError | null }, fallback: string) {
  return response.error?.description || fallback;
}

export async function fetchPosts(
  params?: { 
    cursorCreatedAt?: string; 
    cursorId?: string; 
    limit?: number;
    status?: string;
    socialMediaId?: string;
    platform?: string;
  },
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
  chatSessionId?: string | null;
  socialMediaId: string | null;
  title: string | null;
  content: {
    content: string | null;
    hashtag: string | null;
    resource_list: string[];
    post_type: string | null;
  };
  status: string | null;
  // Attach a new post to an existing post-builder so the builder's group list picks it up
  // on the next GET (important when the user publishes a mode the builder didn't have yet,
  // e.g. adding a Reel bucket to a builder that was seeded only with a Post).
  postBuilderId?: string | null;
  platform?: string | null;
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

export async function publishPost(
  payload: { postId: string; socialMediaIds: string[]; isPrivate?: boolean | null, publishToMeAiFeed?: boolean | null },
  signal?: AbortSignal
) {
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

export async function unpublishPost(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<{
    isSuccess: boolean;
    isFailure: boolean;
    error: { code: string; description: string } | null;
    value: { postId: string; status: string; targets: unknown[] } | null;
  }>(`/api/Ai/posts/${postId}/unpublish`, { method: 'POST', signal }, { auth: true });

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to unpublish post.'));
  }

  return response;
}

export async function updatePublishedPost(
  postId: string,
  payload: { content: string; hashtag?: string | null },
  signal?: AbortSignal
) {
  const response = await clientFetch<{
    isSuccess: boolean;
    isFailure: boolean;
    error: { code: string; description: string } | null;
    value: { postId: string; targets: unknown[] } | null;
  }>(`/api/Ai/posts/${postId}/update-published`, { method: 'POST', data: payload, signal }, { auth: true });

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to update published post.'));
  }

  return response;
}

export async function fetchPlatformPosts(
  socialMediaId: string,
  cursor: string = '',
  limit: number = 10,
  signal?: AbortSignal
) {
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

export async function fetchPlatformPostAnalytics(
  socialMediaId: string,
  platformPostId: string,
  refresh: boolean = false,
  signal?: AbortSignal
) {
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

export async function fetchBatchDashboardSummary(socialMediaIds: string[], postLimit: number = 5) {
  const response = await clientFetch<BatchDashboardSummaryResponse>(
    '/api/Ai/posts/dashboard-summary/batch',
    {
      method: 'POST',
      data: { socialMediaIds, postLimit }
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(response.error?.description || 'Unable to load dashboard summaries.');
  }

  return response;
}

export async function fetchPlatformDashboardSummary(
  socialMediaId: string,
  postLimit: number = 5,
  signal?: AbortSignal
) {
  const response = await clientFetch<PlatformDashboardSummaryResponse>(
    `/api/Ai/posts/social/${socialMediaId}/dashboard-summary`,
    {
      method: 'GET',
      params: { postLimit },
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load dashboard summary.'));
  }

  return response;
}

export async function startAiPostImprove(
  postId: string,
  payload: { improveCaption: boolean; improveImage: boolean; style: string; platform?: string | null; userInstruction?: string | null },
  signal?: AbortSignal
) {
  const response = await clientFetch<AiPostImproveResponse>(
    `/api/Ai/recommendations/posts/${postId}/improve`,
    {
      method: 'POST',
      data: payload,
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to start AI improvement.'));
  }

  return response;
}

export async function fetchAiPostImprove(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<AiPostImproveResponse>(
    `/api/Ai/recommendations/posts/${postId}/improve`,
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load AI improvement status.'));
  }

  return response;
}

export async function approveAiPostImprove(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<BooleanResponse>(
    `/api/Ai/recommendations/posts/${postId}/improve/approve`,
    {
      method: 'POST',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to approve AI improvement.'));
  }

  return response;
}

export async function rejectAiPostImprove(postId: string, signal?: AbortSignal) {
  const response = await clientFetch<BooleanResponse>(
    `/api/Ai/recommendations/posts/${postId}/improve/reject`,
    {
      method: 'POST',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to reject AI improvement.'));
  }

  return response;
}
