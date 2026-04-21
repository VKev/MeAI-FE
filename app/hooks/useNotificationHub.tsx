import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import envConfig from '@/config';
import type { NotificationDelivery } from '@/models/notification.model';
import { NotificationTypes } from '@/models/notification.model';
import type { SocialMedia, SocialMediaListResponse } from '@/models/social-media.model';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import PublishBatchToast from '@/components/notifications/PublishBatchToast';

const HUB_URL = `${envConfig.VITE_API_URL}/hubs/notifications`;
const NOTIFICATION_RECEIVED = 'NotificationReceived';
const RECONNECT_DELAYS = [0, 2000, 5000, 10000];

async function fetchAccessToken(): Promise<string> {
  const res = await fetch('/api/notification-token', { credentials: 'include' });
  const data = await res.json();
  return data.token ?? '';
}

export function useNotificationHub(enabled: boolean) {
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef('');
  const queryClient = useQueryClient();

  const handleNotification = useCallback(
    (notification: NotificationDelivery) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (
        notification.type === NotificationTypes.AiImageGenerationCompleted ||
        notification.type === NotificationTypes.AiVideoGenerationCompleted
      ) {
        queryClient.invalidateQueries({ queryKey: ['workspace-chats'] });
      }

      if (
        notification.type === NotificationTypes.AiImageGenerationFailed ||
        notification.type === NotificationTypes.AiVideoGenerationFailed
      ) {
        toast.error(notification.title || 'Generation failed', {
          description: notification.message
        });
        queryClient.invalidateQueries({ queryKey: ['workspace-chats'] });
      }

      const isPublishNotification =
        notification.type === NotificationTypes.PostPublishTargetCompleted ||
        notification.type === NotificationTypes.PostPublishTargetFailed ||
        notification.type === NotificationTypes.PostPublishTargetRolledBack ||
        notification.type === NotificationTypes.PostPublishBatchCompleted ||
        notification.type === NotificationTypes.PostUnpublishTargetCompleted ||
        notification.type === NotificationTypes.PostUnpublishTargetFailed ||
        notification.type === NotificationTypes.PostUnpublishBatchCompleted ||
        notification.type === NotificationTypes.PostUpdateTargetCompleted ||
        notification.type === NotificationTypes.PostUpdateTargetFailed ||
        notification.type === NotificationTypes.PostUpdateBatchCompleted;

      if (!isPublishNotification) return;

      type BatchPayload = {
        postId?: string;
        finalStatus?: string;
        targets?: Array<{ socialMediaId: string; socialMediaType: string; status: string }>;
      };
      let payload: BatchPayload | null = null;
      try {
        payload = notification.payloadJson ? JSON.parse(notification.payloadJson) : null;
      } catch {
        payload = null;
      }

      // Every publish-flow notification should refresh the post-builder so banners + per-target
      // state reconcile with BE. Refetch in addition to invalidate so active queries bypass staleTime.
      queryClient.invalidateQueries({ queryKey: ['post-builder'] });
      queryClient.refetchQueries({ queryKey: ['post-builder'] });

      // Only surface toasts for failures (user needs to see the platform + reason) and for the
      // ONE batch-completion per action. Per-target success toasts are intentionally silenced —
      // the green/orange banner flip in the UI already communicates "target X done."
      if (
        notification.type === NotificationTypes.PostPublishTargetFailed ||
        notification.type === NotificationTypes.PostPublishTargetRolledBack ||
        notification.type === NotificationTypes.PostUnpublishTargetFailed ||
        notification.type === NotificationTypes.PostUpdateTargetFailed
      ) {
        const failedPayload = payload as unknown as {
          socialMediaType?: string;
          errorCode?: string;
          errorMessage?: string;
        } | null;
        console.error('[NotificationHub] publish-flow target failed:', {
          type: notification.type,
          socialMediaType: failedPayload?.socialMediaType,
          errorCode: failedPayload?.errorCode,
          errorMessage: failedPayload?.errorMessage,
          raw: notification
        });
        toast.error(notification.title || 'Failed', {
          description: notification.message
        });
        return;
      }

      if (
        notification.type !== NotificationTypes.PostPublishBatchCompleted &&
        notification.type !== NotificationTypes.PostUnpublishBatchCompleted &&
        notification.type !== NotificationTypes.PostUpdateBatchCompleted
      ) {
        return;
      }

      const tone: 'success' | 'error' = payload?.finalStatus === 'failed' ? 'error' : 'success';
      const title = notification.title || (tone === 'error' ? 'Finished with errors' : 'Finished');
      const message = notification.message ?? '';

      // Only render the rich card when we have target info. Otherwise fall back to a plain toast.
      if (!payload?.targets || payload.targets.length === 0) {
        if (tone === 'error') toast.error(title, { description: message });
        else toast.success(title, { description: message });
        return;
      }

      // Render the enriched toast with avatar + platform icon per target. Fetch the user's
      // social-media list (cached) so we can resolve profile info for each socialMediaId.
      (async () => {
        let accounts: SocialMedia[] = [];
        try {
          const data = await queryClient.ensureQueryData<SocialMediaListResponse>({
            queryKey: ['social-medias-publish'],
            queryFn: fetchSocialMedias,
            staleTime: 30_000
          });
          accounts = data.value ?? [];
        } catch {
          // If the fetch fails we still render the toast — names will just show as fallback.
        }

        const toastFn = tone === 'error' ? toast.error : toast.success;
        toastFn(title, {
          description: (
            <PublishBatchToast
              message={message}
              targets={payload?.targets ?? []}
              accounts={accounts}
            />
          ),
          duration: 6000
        });
      })();
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let disposed = false;

    (async () => {
      const token = await fetchAccessToken();
      if (disposed || !token) return;

      tokenRef.current = token;

      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => tokenRef.current,
          withCredentials: true,
          transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling
        })
        .withAutomaticReconnect(RECONNECT_DELAYS)
        .configureLogging(LogLevel.Warning)
        .build();

      connectionRef.current = connection;

      connection.on(NOTIFICATION_RECEIVED, handleNotification);

      connection.onreconnected(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });

      try {
        await connection.start();
      } catch (err) {
        console.error('[NotificationHub] Connection failed:', err);
      }
    })();

    return () => {
      disposed = true;
      const conn = connectionRef.current;
      if (conn && conn.state !== HubConnectionState.Disconnected) {
        conn.stop();
      }
      connectionRef.current = null;
    };
  }, [enabled, handleNotification]);
}
