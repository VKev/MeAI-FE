// api/Gemini/post-prepare
export type TSocialMediaPostType = "post" | "reel" | null;
export type TPlatform = "tiktok" | "instagram" | "facebook" | "threads" | null;

export type TSocialMediaPostPrepare = {
  socialMediaId: string | null;
  type: TSocialMediaPostType;
  platform: TPlatform;
  resourceIds: string[];
}

export type TPostPreparePayload = {
  workspaceId: string;
  resourceIds: string[];
  postType: string | null;
  language: string | null;
  instruction: string | null;
  socialMedia: TSocialMediaPostPrepare[];
}

export type TDraftPost = {
  postId: string;
  status: string;
  postType: string | null;
  caption: string;
  title: string | null;
  resourceIds: string[];
  hashtags: string[];
  trendingHashtags: string[];
  callToAction: string | null;
}

export type TSocialMediaPostPrepareResponse = {
  socialMediaId: string;
  type: TSocialMediaPostType;
  resourceIds: string[];
  drafts: TDraftPost[];
}

export type TPostPrepare = {
  postBuilderId: string;
  workspaceId: string;
  postType: string | null;
  resourceIds: string[];
  socialMedia: TSocialMediaPostPrepareResponse[];
}

export type TPostPrepareResponse = {
  value: TPostPrepare;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
}

// api/Gemini/captions
export type TCreateCaptionPost = {
  postId: string;
  socialMediaType: string;
  type: string | null;
  platform: TPlatform;
  resourceIds: string[];
}

export type TCreatePostCaptionPayload = {
  language: string | null;
  instruction: string | null;
  socialMedia: TCreateCaptionPost[];
}
