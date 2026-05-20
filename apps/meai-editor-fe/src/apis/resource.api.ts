import { fetcher } from "@/apis/fetcher"
import { TResult } from "@/models/common.model";
import { FetchResourcesParams, FetchResourcesResponse, TUploadResourceResponse } from "@/models/resource.model"

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

export const resourceApi = {
  async uploadResource(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetcher.post<TUploadResourceResponse>('/api/User/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    })

    return response.data.value;
  },

  async getAllUserResource(params: FetchResourcesParams) {
    const limit = normalizeLimit(params.limit);
    const searchParams = new URLSearchParams({ limit: String(limit) });

    if (params.cursor?.cursorCreatedAt && params.cursor?.cursorId) {
      searchParams.set('cursorCreatedAt', params.cursor.cursorCreatedAt);
      searchParams.set('cursorId', params.cursor.cursorId);
    }

    const response = await fetcher.get<FetchResourcesResponse>(`/api/User/resources?${searchParams.toString()}`, {
      signal: params.signal
    });

    return response.data.value;
  },

  async deleteResource(resourceId: string) {
    const res = await fetcher.delete<TResult<null>>(`/api/User/resources/${resourceId}`);
    return res.data.isSuccess;
  }
}