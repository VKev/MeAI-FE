export type SocialMediaProfile = {
  userId?: string | null;
  username?: string | null;
  displayName?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  followerCount?: number | null;
  followingCount?: number | null;
  postCount?: number | null;
  pageLikeCount?: number | null;
  pageId?: string | null;
  pageName?: string | null;
  pageProfilePictureUrl?: string | null;
};

export type SocialMedia = {
  id: string;
  type: string;
  profile?: SocialMediaProfile | null;
  metadata?: Record<string, any> | null;
  metadataJson?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateSocialMediaInput = {
  type: string;
  metadata?: Record<string, any> | null;
};

export type UpdateSocialMediaInput = {
  type: string;
  metadata?: Record<string, any> | null;
};

export type SocialMediaListResponse = {
  value: SocialMedia[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type SocialMediaResponse = {
  value: SocialMedia;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type DeleteSocialMediaResponse = {
  value: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
