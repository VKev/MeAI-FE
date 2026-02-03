export type SocialMediaProfile = {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
};

export type SocialMedia = {
  id: string;
  type: string;
  profile?: SocialMediaProfile | null;
  metadata?: Record<string, any> | null;
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
