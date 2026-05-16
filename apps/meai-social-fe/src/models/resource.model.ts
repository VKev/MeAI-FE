import type { TResult } from '@/models/feed.model'

export type TUploadResourceValue = {
  id?: string
  resourceId?: string
  resourceType?: string | null
  contentType?: string | null
  status?: string | null
}

export type TUploadResourceResponse = TResult<TUploadResourceValue>
