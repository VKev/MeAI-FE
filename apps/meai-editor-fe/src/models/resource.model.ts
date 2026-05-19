export type TResult<T> = {
  value: T
  isSuccess: boolean
  isFailure: boolean
  error?: {
    code: string
    description: string
  }
}
export type TUploadResourceValue = {
  id?: string
  resourceId?: string
  resourceType?: string | null
  contentType?: string | null
  status?: string | null
}

export type TUploadResourceResponse = TResult<TUploadResourceValue>
