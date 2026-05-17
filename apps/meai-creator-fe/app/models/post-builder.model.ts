import type { TPlatform, TSocialMediaPostType } from "@/models/post-prepare.model";

export type TPostContent = {
  content: string | null;
  hashtag: string | null;
  resource_list: string[];
  post_type: string | null;
}

export type TPostMedia = {
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
}

export type TPostPublication = {
  id: string;
  socialMediaId: string;
  socialMediaType: string;
  destinationOwnerId: string;
  externalContentId: string;
  externalContentIdType: string;
  contentType: string;
  publishStatus: string;
  publishedAt: string | null;
  createdAt: string;
}

export type TPostBuilderSocialMediaPost = {
  id: string;
  userId: string;
  workspaceId: string | null;
  socialMediaId: string | null;
  title: string | null;
  content: TPostContent;
  status: string | null;
  isPublished: boolean;
  media: TPostMedia[];
  publications: TPostPublication[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type TPostBuilderSocialMedia = {
  socialMediaId: string | null;
  platform: TPlatform;
  type: TSocialMediaPostType;
  posts: TPostBuilderSocialMediaPost[];
}

export type TPostBuilder = {
  id: string;
  workspaceId: string;
  type: string | null;
  resources: TPostMedia[];
  socialMedia: TPostBuilderSocialMedia[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type TPostBuilderResponse = {
  value: TPostBuilder;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
}

export type TPostBuilderSummary = {
  id: string;
  workspaceId: string | null;
  type: string | null;
  postCount: number;
  publishedCount: number;
  platforms: string[];
  thumbnailUrl: string | null;
  firstPostSnippet: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TPostBuilderListResponse = {
  value: TPostBuilderSummary[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
}