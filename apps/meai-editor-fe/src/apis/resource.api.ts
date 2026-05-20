import { fetcher } from "@/apis/fetcher"
import { FetchResourcesParams, FetchResourcesResponse, TCompleteUploadResponse, TDeleteResourceResponse, TPresignedUploadRequest, TPresignedUploadResponse, TUploadResourceResponse } from "@/models/resource.model"

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

function getResourceTypeFromFile(file: File): "video" | "audio" | "image" {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return 'image';
}

export const resourceApi = {

  async oldUploadResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetcher.post<TUploadResourceResponse>(
      '/api/User/resources/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.value;
  },

  async uploadToS3(
    uploadUrl: string,
    file: File,
    headers: Record<string, string>
  ) {
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...headers,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }
  },

  async uploadResource(file: File) {
    const initiatePayload: TPresignedUploadRequest = {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      contentLength: file.size,
      resourceType: getResourceTypeFromFile(file),
    };

    const initiateResponse = await fetcher.post<TPresignedUploadResponse>(
      '/api/User/resources/presigned-upload',
      initiatePayload
    );

    const presigned = initiateResponse.data.value;

    await this.uploadToS3(presigned.uploadUrl, file, presigned.headers);

    const completeResponse = await fetcher.post<TCompleteUploadResponse>(
      `/api/User/resources/${presigned.resourceId}/complete-upload`,
      { status: 'Active' }
    );

    return completeResponse.data.value;
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
    const res = await fetcher.delete<TDeleteResourceResponse>(`/api/User/resources/${resourceId}`);
    return res.data.isSuccess;
  }
}