import { fetcher } from '@/apis/fetcher'
import type { AxiosProgressEvent } from 'axios'
import type { TCompleteUploadResponse, TPresignedUploadRequest, TPresignedUploadResponse, TUploadResourceResponse } from '@/models/resource.model'

type UploadResourceOptions = {
  resourceType?: string
  onUploadProgress?: (event: AxiosProgressEvent) => void
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

  async oldUploadResource(file: File, options: UploadResourceOptions = {}) {
    const formData = new FormData()
    formData.append('file', file)
    if (options.resourceType) {
      formData.append('resourceType', options.resourceType)
    }

    const response = await fetcher.post<TUploadResourceResponse>('/api/User/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onUploadProgress
    })

    return response.data.value
  },

  async uploadToS3(
    uploadUrl: string,
    file: File,
    headers: Record<string, string>,
    onUploadProgress?: (event: AxiosProgressEvent) => void
  ) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)

      try {
        Object.entries(headers || {}).forEach(([k, v]) => {
          xhr.setRequestHeader(k, v)
        })
      } catch (err) {
        // some headers may be restricted; ignore failures to set them
      }

      xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
        if (onUploadProgress) {
          const percentEvent = {
            loaded: (e.loaded as number) ?? 0,
            total: e.lengthComputable ? (e.total as number) : undefined,
          } as AxiosProgressEvent
          onUploadProgress(percentEvent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error('S3 upload failed'))
      xhr.send(file)
    })
  },

  async uploadResource(file: File, options: UploadResourceOptions = {}) {
    const resourceTypePayload = options.resourceType
      ? String(options.resourceType).toLowerCase()
      : getResourceTypeFromFile(file)

    const initiatePayload: TPresignedUploadRequest = {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      contentLength: file.size,
      resourceType: resourceTypePayload as TPresignedUploadRequest['resourceType'],
    };

    const initiateResponse = await fetcher.post<TPresignedUploadResponse>(
      '/api/User/resources/presigned-upload',
      initiatePayload
    );

    const presigned = initiateResponse.data.value;

    await this.uploadToS3(presigned.uploadUrl, file, presigned.headers, options.onUploadProgress);

    const completeResponse = await fetcher.post<TCompleteUploadResponse>(
      `/api/User/resources/${presigned.resourceId}/complete-upload`,
      { status: 'Active' }
    );

    return completeResponse.data.value;
  },
}
