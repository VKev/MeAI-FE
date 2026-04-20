import type { TPostBuilderListResponse, TPostBuilderResponse } from '@/models/post-builder.model';
import { clientFetch } from '@/services/client/api.client';

type ListParams = {
  cursorCreatedAt?: string;
  cursorId?: string;
  limit?: number;
};

export const PostBuilderClientApi = {
  async getPostBuilder(postBuilderId: string) {
    const res = await clientFetch<TPostBuilderResponse>(
      `/api/Ai/post-builders/${postBuilderId}`,
      {
        method: 'GET'
      },
      { auth: true }
    );
    return res;
  },

  async listUserPostBuilders(params?: ListParams, signal?: AbortSignal) {
    const queryParams = { limit: params?.limit ?? 12, ...params };
    const res = await clientFetch<TPostBuilderListResponse>(
      '/api/Ai/post-builders',
      {
        method: 'GET',
        params: queryParams,
        signal
      },
      { auth: true }
    );
    return res;
  },

  async listWorkspacePostBuilders(workspaceId: string, params?: ListParams, signal?: AbortSignal) {
    const queryParams = { limit: params?.limit ?? 12, ...params };
    const res = await clientFetch<TPostBuilderListResponse>(
      `/api/Ai/post-builders/workspace/${workspaceId}`,
      {
        method: 'GET',
        params: queryParams,
        signal
      },
      { auth: true }
    );
    return res;
  }
};
