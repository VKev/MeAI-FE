import type { NotificationListResponse } from '@/models/notification.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchNotifications(params?: { onlyUnread?: boolean; limit?: number; source?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.onlyUnread) searchParams.set('onlyUnread', 'true');
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.source) searchParams.set('source', params.source);

  const query = searchParams.toString();
  return clientFetch<NotificationListResponse>(
    `/api/Notification/notifications${query ? `?${query}` : ''}`,
    { method: 'GET' },
    { auth: true }
  );
}

export async function markNotificationRead(userNotificationId: string) {
  return clientFetch<{ isSuccess: boolean }>(
    `/api/Notification/notifications/${userNotificationId}/read`,
    { method: 'PATCH' },
    { auth: true }
  );
}

export async function markAllNotificationsRead() {
  return clientFetch<{ isSuccess: boolean }>(
    '/api/Notification/notifications/read-all',
    { method: 'PATCH' },
    { auth: true }
  );
}
