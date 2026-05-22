import type { Resource, ResourceCursor, ResourcesResponse, ResourceResponse } from '@/models/resource.model';
import { clientFetch, getApiErrorMessage, isRequestCanceled } from '@/services/client/api.client';

export type TResult<T> = {
  value?: T;
  isSuccess: boolean;
  isFailure?: boolean;
  error?: { code: string; description: string } | null;
};

export type TPresignedUploadRequest = {
  fileName: string;
  contentType: string;
  contentLength: number;
  resourceType?: 'video' | 'audio' | 'image' | string | null;
  workspaceId?: string | null;
  status?: string | null;
};

export type TPresignedUploadValue = {
  resourceId: string;
  uploadUrl: string;
  storageKey?: string;
  method?: string;
  headers?: Record<string, string>;
};

export type TPresignedUploadResponse = TResult<TPresignedUploadValue>;
export type TCompleteUploadResponse = TResult<Resource>;

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

export async function requestPresignedUpload(payload: TPresignedUploadRequest): Promise<TPresignedUploadResponse> {
  const response = await clientFetch<TPresignedUploadResponse>('/api/User/resources/presigned-upload', {
    method: 'POST',
    data: payload
  }, { auth: true });

  return response;
}

export async function uploadResource(file: File, resourceType?: string, workspaceId?: string, status?: string): Promise<Resource> {
  // Step 1: Request presigned upload URL from backend
  const initPayload: TPresignedUploadRequest = {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    contentLength: file.size,
    resourceType: resourceType ?? null,
    workspaceId: workspaceId ?? null,
    status: status ?? null
  };

  const presignedResponse = await requestPresignedUpload(initPayload);

  if (!presignedResponse || !presignedResponse.isSuccess || !presignedResponse.value) {
    throw new Error(getApiErrorMessage(presignedResponse, 'Failed to initiate presigned upload'));
  }

  const presignedValue = presignedResponse.value;
  if (!presignedValue.uploadUrl || !presignedValue.resourceId) {
    throw new Error(getApiErrorMessage(presignedResponse, 'Presigned upload initiation returned invalid data'));
  }

  const uploadUrl: string = presignedValue.uploadUrl;
  const resourceId: string = presignedValue.resourceId;
  const requiredHeaders: Record<string, string> = presignedValue.headers ?? {};

  // Step 2: Upload directly to S3 using the presigned URL
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...requiredHeaders
    },
    body: file
  });

  if (!putResponse.ok) {
    throw new Error(`Failed to upload file to storage (status: ${putResponse.status})`);
  }

  // Step 3: Notify backend to complete upload and obtain resource record
  const completeResponse = await clientFetch<TCompleteUploadResponse>(
    `/api/User/resources/${resourceId}/complete-upload`,
    {
      method: 'POST',
      data: { status: status ?? 'Active' }
    },
    { auth: true }
  );

  if (!completeResponse || !completeResponse.isSuccess || !completeResponse.value) {
    throw new Error(getApiErrorMessage(completeResponse, 'Failed to complete presigned upload'));
  }

  return completeResponse.value;
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
  subscriptionId: string | null;
  subscriptionName: string | null;
  quotaBytes: number | null;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number | null;
  usagePercent: number | null;
  maxUploadFileBytes: number | null;
  systemStorageQuotaBytes: number | null;
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
