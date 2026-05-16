export type NotificationDeliveryModel = {
  notificationId: string
  userNotificationId: string
  userId: string
  source: string
  type: string
  title: string
  message: string
  payloadJson: string | null
  createdByUserId: string | null
  isRead: boolean
  readAt: string | null
  wasOnlineWhenCreated: boolean
  createdAt: string
  updatedAt: string | null
}

export function parseNotificationPayload(payloadJson: string | null) {
  if (!payloadJson) return null

  try {
    return JSON.parse(payloadJson)
  } catch {
    return null
  }
}
