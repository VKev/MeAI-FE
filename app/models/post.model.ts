export type PostContent = {
  content: string | null;
  hashtag: string | null;
  resourceList: string[] | null;
  postType: string | null;
};

export type PostMedia = {
  resourceId: string;
  presignedUrl: string;
  contentType: string | null;
  resourceType: string | null;
};

export type PostPublication = {
  id: string;
  socialMediaId: string;
  socialMediaType: string | null;
  destinationOwnerId: string | null;
  externalContentId: string | null;
  externalContentIdType: string | null;
  contentType: string | null;
  publishStatus: string | null;
  publishedAt: string | null;
  createdAt: string | null;
};

export type Post = {
  id: string;
  userId: string;
  workspaceId: string | null;
  socialMediaId: string | null;
  title: string | null;
  content: PostContent | null;
  status: string | null;
  isPublished: boolean;
  media: PostMedia[];
  publications: PostPublication[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type PostCursor = {
  cursorCreatedAt: string;
  cursorId: string;
};

export type PostApiError = {
  code: string;
  description?: string;
  message?: string;
};

export type PostsResponse = {
  isSuccess: boolean;
  isFailure?: boolean;
  error: PostApiError | null;
  value: Post[] | null;
};
