import type { NotificationListResponse } from '@/models/notification.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchNotifications(params?: {
  onlyUnread?: boolean;
  limit?: number;
  source?: string;
  typePrefix?: string;
  relatedId?: string;
  beforeCreatedAt?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('onlyUnread', params?.onlyUnread ? 'true' : 'false');
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.source) searchParams.set('source', params.source);
  if (params?.typePrefix) searchParams.set('typePrefix', params.typePrefix);
  if (params?.relatedId) searchParams.set('relatedId', params.relatedId);
  if (params?.beforeCreatedAt) searchParams.set('beforeCreatedAt', params.beforeCreatedAt);

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
