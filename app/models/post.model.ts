export type PostContent = {
  content: string | null;
  hashtag: string | null;
  resource_list: string[] | null;
  post_type: string | null;
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

export type PostSchedule = {
  scheduleGroupId: string;
  scheduledAtUtc: string;
  timezone: string | null;
  socialMediaIds: string[];
  isPrivate: boolean | null;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  workspaceId: string | null;
  postBuilderId: string | null;
  chatSessionId: string | null;
  socialMediaId: string | null;
  title: string | null;
  content: PostContent | null;
  status: string | null;
  schedule: PostSchedule | null;
  isPublished: boolean;
  media: PostMedia[];
  publications: PostPublication[];
  views?: number;
  likes?: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PostApiError = {
  code: string;
  description: string;
};

export type PostsResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: Post[] | null;
};

export type SinglePostResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: Post | null;
};

export type BooleanResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: boolean;
};

export type PlatformPostStats = {
  views: number | null;
  reach?: number | null;
  impressions?: number | null;
  likes: number | null;
  comments: number | null;
  replies: number | null;
  shares: number | null;
  reposts: number | null;
  quotes: number | null;
  totalInteractions: number | null;
  saves?: number | null;
  reactionBreakdown?: Record<string, number> | null;
  metricBreakdown?: Record<string, number> | null;
};

export type PlatformAccountInsights = {
  accountId: string | null;
  accountName: string | null;
  username: string | null;
  followers: number | null;
  following: number | null;
  mediaCount: number | null;
  metadata?: Record<string, string> | null;
};

export type PlatformCommentSample = {
  id: string;
  text: string | null;
  authorId: string | null;
  authorName: string | null;
  authorUsername: string | null;
  createdAt: string | null;
  likeCount: number | null;
  replyCount: number | null;
  permalink: string | null;
};

export type PlatformPostItem = {
  platformPostId: string;
  title: string | null;
  text: string | null;
  description: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  shareUrl: string | null;
  embedUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  stats: PlatformPostStats | null;
};

export type PlatformPostsValue = {
  socialMediaId: string;
  platform: string;
  nextCursor: string | null;
  hasMore: boolean;
  items: PlatformPostItem[];
};

export type PlatformPostsResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: PlatformPostsValue | null;
};

export type PostAnalysis = {
  engagementRateByViews: number | null;
  conversationRateByViews: number | null;
  amplificationRateByViews: number | null;
  approvalRateByViews: number | null;
  performanceBand: string | null;
  highlights: string[];
};

export type PlatformPostAnalyticsValue = {
  socialMediaId: string;
  platform: string;
  platformPostId: string;
  post: PlatformPostItem;
  stats: PlatformPostStats;
  analysis: PostAnalysis;
  retrievedAt: string | null;
  accountInsights?: PlatformAccountInsights | null;
  commentSamples?: PlatformCommentSample[] | null;
  additionalMetrics?: Record<string, number> | null;
};

export type PlatformPostAnalyticsResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: PlatformPostAnalyticsValue | null;
};

export type PlatformDashboardPost = {
  post: PlatformPostItem;
  analysis: PostAnalysis | null;
};

export type PlatformDashboardSummaryValue = {
  socialMediaId: string;
  platform: string;
  fetchedPostCount: number;
  hasMorePosts: boolean;
  nextCursor: string | null;
  latestPublishedPostId: string | null;
  latestPublishedAt: string | null;
  aggregatedStats: PlatformPostStats;
  latestAnalysis: PostAnalysis | null;
  accountInsights?: PlatformAccountInsights | null;
  posts: PlatformDashboardPost[];
};

export type PlatformDashboardSummaryResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: PlatformDashboardSummaryValue | null;
};

export type BatchDashboardSummaryResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: PlatformDashboardSummaryValue[];
};

export type PublishPostResult = {
  socialMediaId: string;
  socialMediaType: string;
  pageId: string;
  externalPostId: string;
  publicationId?: string | null;
  publishStatus?: string | null;
};

export type PublishPostValue = {
  postId: string;
  status: string;
  results: PublishPostResult[];
};

export type PublishPostResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: PostApiError | null;
  value: PublishPostValue | null;
};
