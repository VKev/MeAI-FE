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
  async uploadEditedResource(file: File, onProgress?: (percent: number) => void) {
    const formData = new FormData()
    formData.append('file', file)

    // Nếu có progress callback, dùng XHR (vì fetch không support upload progress)
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/User/resources');
        // Let fetcher handle auth header (hoặc manually add token)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.value);
          } catch (err) {
            reject(err);
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
    }

    // Fallback: dùng fetch cũ (không progress)
    const response = await fetcher.post<TUploadResourceResponse>(
      '/api/User/resources',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.value;
  },

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