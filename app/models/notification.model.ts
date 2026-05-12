export type NotificationDelivery = {
  notificationId: string;
  userNotificationId: string;
  userId: string;
  source: string;
  type: string;
  title: string;
  message: string;
  payloadJson: string | null;
  createdByUserId: string | null;
  isRead: boolean;
  readAt: string | null;
  wasOnlineWhenCreated: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type NotificationListResponse = {
  value: NotificationDelivery[];
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string };
};

export const NotificationTypes = {
  AiImageGenerationSubmitted: 'ai.image_generation.submitted',
  AiImageGenerationCompleted: 'ai.image_generation.completed',
  AiImageGenerationFailed: 'ai.image_generation.failed',
  AiVideoGenerationSubmitted: 'ai.video_generation.submitted',
  AiVideoGenerationCompleted: 'ai.video_generation.completed',
  AiVideoGenerationFailed: 'ai.video_generation.failed',
  PostPublishTargetSubmitted: 'post.publish.target_submitted',
  PostPublishTargetCompleted: 'post.publish.target_completed',
  PostPublishTargetFailed: 'post.publish.target_failed',
  PostPublishTargetRolledBack: 'post.publish.target_rolled_back',
  PostPublishBatchCompleted: 'post.publish.batch_completed',
  PostUnpublishTargetCompleted: 'post.unpublish.target_completed',
  PostUnpublishTargetFailed: 'post.unpublish.target_failed',
  PostUnpublishBatchCompleted: 'post.unpublish.batch_completed',
  PostUpdateTargetCompleted: 'post.update.target_completed',
  PostUpdateTargetFailed: 'post.update.target_failed',
  PostUpdateBatchCompleted: 'post.update.batch_completed',
  AiPostImproveSubmitted: 'ai.post_improve.submitted',
  AiPostImproveProcessing: 'ai.post_improve.processing',
  AiPostImproveCompleted: 'ai.post_improve.completed',
  AiPostImproveFailed: 'ai.post_improve.failed'
} as const;

export type PostPublishTargetPayload = {
  correlationId: string;
  postId: string;
  socialMediaId: string;
  socialMediaType: string;
  destinations?: Array<{ pageId: string; externalContentId: string }>;
  errorCode?: string;
  errorMessage?: string;
};

export type PostPublishBatchPayload = {
  correlationId: string;
  postId: string;
  finalStatus: 'published' | 'failed' | string;
};
