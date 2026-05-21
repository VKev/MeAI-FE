import { fetcher } from "@/apis/fetcher"
import { TUploadResourceResponse } from "@/models/resource.model"

export const resourceApi = {
  async uploadResource(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetcher.post<TUploadResourceResponse>('/api/User/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    })

    return response.data.value
  }
}