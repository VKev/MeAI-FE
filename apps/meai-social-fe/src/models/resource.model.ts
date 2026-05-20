import type { TResult } from '@/models/feed.model'

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

export type TUploadResourceResponse = TResult<Resource>;

export type TPresignedUploadRequest = {
  fileName: string;
  contentType: string;
  contentLength: number;
  resourceType: "video" | "audio" | "image";
};

export type TPresignedUploadValue = {
  resourceId: string;
  uploadUrl: string;
  storageKey: string;
  method: string;
  headers: Record<string, string>;
};

export type TPresignedUploadResponse = TResult<TPresignedUploadValue>;

export type TCompleteUploadResponse = TResult<Resource>;