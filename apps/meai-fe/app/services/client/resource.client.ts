import type { Resource, ResourceCursor, ResourcesResponse, ResourceResponse } from '@/models/resource.model';
import { clientFetch, getApiErrorMessage, isRequestCanceled } from '@/services/client/api.client';

type FetchResourcesParams = {
  limit?: number;
  cursor?: ResourceCursor;
  workspaceId?: string;
  signal?: AbortSignal;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type ResourceResponseShape = Partial<ResourcesResponse> & {
  value?: Resource[] | unknown[] | null;
  error?: Partial<ResourcesResponse['error']> | null;
};

function normalizeResourcesResponse(response: unknown): ResourcesResponse | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const candidate = response as ResourceResponseShape;

  if (candidate.isSuccess !== true) {
    return null;
  }

  return {
    value: Array.isArray(candidate.value) ? (candidate.value as ResourcesResponse['value']) : [],
    isSuccess: true,
    isFailure: candidate.isFailure === true,
    error: {
      code: typeof candidate.error?.code === 'string' ? candidate.error.code : '',
      description: typeof candidate.error?.description === 'string' ? candidate.error.description : ''
    }
  };
}

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

  const basePath = params.workspaceId 
    ? `/api/User/resources/workspace/${params.workspaceId}`
    : `/api/User/resources`;

  const requestUrl = `${basePath}?${searchParams.toString()}`;

  try {
    const rawResponse = await clientFetch<unknown>(
      requestUrl,
      {
        method: 'GET',
        signal: params.signal
      },
      { auth: true }
    );

    const response = normalizeResourcesResponse(rawResponse);

    if (!response) {
      const message = getApiErrorMessage(rawResponse, 'Unable to load resources.');
      console.error('[library] malformed resources response', {
        requestUrl,
        cursor: params.cursor ?? null,
        rawResponse,
        message
      });
      throw new Error(message);
    }

    console.debug('[library] resources loaded', {
      requestUrl,
      cursor: params.cursor ?? null,
      count: response.value.length
    });

    return response;
  } catch (error) {
    if (isRequestCanceled(error)) {
      console.warn('[library] resources request canceled', {
        requestUrl,
        cursor: params.cursor ?? null
      });
      throw error;
    }

    console.error('[library] resources request failed', {
      requestUrl,
      cursor: params.cursor ?? null,
      error
    });

    throw error;
  }
}

export async function uploadResource(file: File, resourceType?: string, workspaceId?: string, status?: string): Promise<Resource> {
  const formData = new FormData();
  formData.append('file', file);
  if (resourceType) {
    formData.append('resourceType', resourceType);
  }
  if (workspaceId) {
    formData.append('workspaceId', workspaceId);
  }
  if (status) {
    formData.append('status', status);
  }

  const response = await clientFetch<ResourceResponse>(
    '/api/User/resources',
    {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    },
    { auth: true }
  );

  if (!response || !response.isSuccess || !response.value) {
    throw new Error(getApiErrorMessage(response, 'Failed to upload resource'));
  }

  return response.value;
}

type WorkspaceAiResource = {
  chatSessionId: string;
  chatId: string;
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
  chatCreatedAt: string | null;
};

type WorkspaceAiResourcesResponse = {
  value: WorkspaceAiResource[];
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string };
};

export async function fetchWorkspaceResources(
  workspaceId: string,
  resourceTypes?: string[],
  signal?: AbortSignal
): Promise<WorkspaceAiResource[]> {
  const params = new URLSearchParams();
  if (resourceTypes?.length) {
    for (const type of resourceTypes) {
      params.append('resourceTypes', type);
    }
  }

  const url = `/api/Ai/chats/workspace/${workspaceId}/resources${params.toString() ? `?${params}` : ''}`;

  const response = await clientFetch<WorkspaceAiResourcesResponse>(
    url,
    { method: 'GET', signal },
    { auth: true }
  );

  if (!response?.isSuccess) {
    throw new Error(getApiErrorMessage(response, 'Failed to load workspace resources'));
  }

  return response.value ?? [];
}

export async function deleteResource(resourceId: string): Promise<void> {
  const response = await clientFetch<{ isSuccess: boolean; error?: { description: string } }>(
    `/api/User/resources/${resourceId}`,
    { method: 'DELETE' },
    { auth: true }
  );

  if (!response?.isSuccess) {
    throw new Error(getApiErrorMessage(response, 'Failed to delete resource'));
  }
}

export type StorageUsage = {
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number;
  usagePercent: number;
  maxUploadFileBytes: number;
  isOverQuota: boolean;
};

export async function fetchStorageUsage(): Promise<StorageUsage> {
  const response = await clientFetch<{ value: StorageUsage; isSuccess: boolean }>(
    '/api/User/resources/storage-usage',
    { method: 'GET' },
    { auth: true }
  );

  if (!response?.isSuccess || !response.value) {
    throw new Error(getApiErrorMessage(response, 'Failed to fetch storage usage'));
  }

  return response.value;
}
