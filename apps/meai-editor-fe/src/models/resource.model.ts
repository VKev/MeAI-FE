import { TResult } from "@/models/common.model"

export type TUploadResourceValue = {
  id?: string
  resourceId?: string
  resourceType?: string | null
  contentType?: string | null
  status?: string | null
}

export type TUploadResourceResponse = TResult<TUploadResourceValue>

export type ResourceCursor = {
  cursorCreatedAt: string;
  cursorId: string;
};

export type FetchResourcesParams = {
  limit?: number;
  cursor?: ResourceCursor;
  signal?: AbortSignal;
};

export type Resource = {
  id: string;
  link: string;
  status: string | null;
  resourceType: string | null;
  contentType: string | null;
  workspaceId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  originKind?: string | null;
  originSourceUrl?: string | null;
  originChatSessionId?: string | null;
  originChatId?: string | null;
};

export type FetchResourcesResponse = TResult<Resource[]>;