import { fetcher } from '@/apis/fetcher'
import type { AxiosProgressEvent } from 'axios'
import type { TUploadResourceResponse } from '@/models/resource.model'

type UploadResourceOptions = {
  resourceType?: string
  onUploadProgress?: (event: AxiosProgressEvent) => void
}

export const resourceApi = {
  async uploadResource(file: File, options: UploadResourceOptions = {}) {
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
  }
}
