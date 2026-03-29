import type { Resource, ResourceCursor, ResourcesResponse } from '@/models/resource.model';
import { clientFetch, getApiErrorMessage, isRequestCanceled } from '@/services/client/api.client';

type FetchResourcesParams = {
  limit?: number;
  cursor?: ResourceCursor;
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

  const requestUrl = `/api/User/resources?${searchParams.toString()}`;

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
