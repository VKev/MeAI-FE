import { fetcher } from '@/apis/fetcher'
import type { NotificationDeliveryModel } from '@/models/notification.model'

type NotificationListResponse = {
  value: NotificationDeliveryModel[]
}

type GetNotificationsParams = {
  onlyUnread?: boolean
  limit?: number
  source?: string
}

export const notificationApi = {
  async getNotifications({ onlyUnread = false, limit = 50, source = 'Social' }: GetNotificationsParams) {
    const response = await fetcher.get<NotificationListResponse>('/api/Notification/notifications', {
      params: {
        onlyUnread,
        limit,
        source
      }
    })

    return response.data.value ?? []
  },

  async markAsRead(userNotificationId: string) {
    await fetcher.patch(`/api/Notification/notifications/${userNotificationId}/read`)
  },

  async markAllAsRead() {
    await fetcher.patch('/api/Notification/notifications/read-all')
  }
}
