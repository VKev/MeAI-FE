import type { PostsResponse } from '@/models/post.model';
import { clientFetch } from '@/services/client/api.client';

function getErrorMessage(response: PostsResponse, fallback: string) {
  return response.error?.message || fallback;
}

export async function fetchPosts(signal?: AbortSignal) {
  const response = await clientFetch<PostsResponse>(
    '/api/Ai/posts',
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load posts.'));
  }

  return response;
}

export async function fetchWorkspacePosts(workspaceId: string, signal?: AbortSignal) {
  const response = await clientFetch<PostsResponse>(
    `/api/Ai/posts/workspace/${workspaceId}`,
    {
      method: 'GET',
      signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(getErrorMessage(response, 'Unable to load workspace posts.'));
  }

  return response;
}
