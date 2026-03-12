import type { ResourceCursor, ResourcesResponse } from '@/models/resource.model';
import { clientFetch } from '@/services/client/api.client';

type FetchResourcesParams = {
  limit?: number;
  cursor?: ResourceCursor;
  signal?: AbortSignal;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

export async function fetchResources(params: FetchResourcesParams = {}) {
  const limit = normalizeLimit(params.limit);
  const searchParams = new URLSearchParams({ limit: String(limit) });

  if (params.cursor?.cursorCreatedAt && params.cursor?.cursorId) {
    searchParams.set('cursorCreatedAt', params.cursor.cursorCreatedAt);
    searchParams.set('cursorId', params.cursor.cursorId);
  }

  const response = await clientFetch<ResourcesResponse>(
    `/api/User/resources?${searchParams.toString()}`,
    {
      method: 'GET',
      signal: params.signal
    },
    { auth: true }
  );

  if (!response.isSuccess) {
    throw new Error(response.error.description || 'Unable to load resources.');
  }

  return response;
}
