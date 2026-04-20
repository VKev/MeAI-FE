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
  AiVideoGenerationFailed: 'ai.video_generation.failed'
} as const;
