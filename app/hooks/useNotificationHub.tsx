import { useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import envConfig from '@/config';
import type { AiDraftPostGenerationPayload, NotificationDelivery } from '@/models/notification.model';
import { NotificationBellHiddenTypes, NotificationTypes } from '@/models/notification.model';
import type { SocialMedia, SocialMediaListResponse } from '@/models/social-media.model';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import PublishBatchToast from '@/components/notifications/PublishBatchToast';
import { useGenerationFailureStore } from '@/store/generation-failure.store';
import {
  isAiDraftPostGenerationNotification,
  useAiRecommendationEventStore
} from '@/store/ai-recommendation-events.store';

const HUB_URL = `${envConfig.VITE_API_URL}/hubs/notifications`;
const NOTIFICATION_RECEIVED = 'NotificationReceived';
const RECONNECT_DELAYS = [0, 2000, 5000, 10000];

async function fetchAccessToken(): Promise<string> {
  const res = await fetch('/api/notification-token', { credentials: 'include' });
  const data = (await res.json()) as { token?: string };
  return data.token ?? '';
}

function parsePayload<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function collectTaskIds(payload: AiDraftPostGenerationPayload | null) {
  return [payload?.correlationId, payload?.postId, payload?.draftPostId].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
}

function collectResultPostIds(payload: AiDraftPostGenerationPayload | null) {
  return [payload?.postId, payload?.draftPostId].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
}

export function useNotificationHub(enabled: boolean) {
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef('');
  const queryClient = useQueryClient();

  const handleNotification = useCallback(
    (notification: NotificationDelivery) => {
      if (!NotificationBellHiddenTypes.has(notification.type)) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }

      if (isAiDraftPostGenerationNotification(notification.type)) {
        useAiRecommendationEventStore.getState().upsertNotification(notification);

        const payload = parsePayload<AiDraftPostGenerationPayload>(notification.payloadJson);
        const taskIds = collectTaskIds(payload);
        const resultPostIds = collectResultPostIds(payload);
        const isCompletedNotification = notification.type === NotificationTypes.AiDraftPostGenerationCompleted;
        const isResultNotification =
          isCompletedNotification || notification.type === NotificationTypes.AiDraftPostGenerationFailed;

        for (const id of taskIds) {
          queryClient.invalidateQueries({ queryKey: ['ai-recommendation-task', id] });
        }

        if (isResultNotification) {
          for (const id of taskIds) {
            queryClient.refetchQueries({ queryKey: ['ai-recommendation-task', id] });
          }

          if (isCompletedNotification) {
            for (const id of resultPostIds) {
              queryClient.invalidateQueries({ queryKey: ['ai-recommendation-draft-post', id] });
              queryClient.refetchQueries({ queryKey: ['ai-recommendation-draft-post', id] });
            }
          }
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          queryClient.refetchQueries({ queryKey: ['posts'] });
        }
      }

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

        // Reframe variant failures don't mark the parent chat as Failed — BE intentionally
        // leaves the chat alive. Track per-parent failed-variant counts so the item can drop
        // its pending skeletons instead of spinning forever.
        const payload = parsePayload<{ parentCorrelationId?: string }>(notification.payloadJson);
        const parent = payload?.parentCorrelationId;
        if (typeof parent === 'string' && parent) {
          useGenerationFailureStore.getState().incrementFailed(parent);
        }
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
      const payload = parsePayload<BatchPayload>(notification.payloadJson);

      // Every publish-flow notification should refresh the post-builder so banners + per-target
      // state reconcile with BE. Refetch in addition to invalidate so active queries bypass staleTime.
      queryClient.invalidateQueries({ queryKey: ['post-builder'] });
      queryClient.refetchQueries({ queryKey: ['post-builder'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.refetchQueries({ queryKey: ['posts'] });

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
            queryFn: () => fetchSocialMedias(),
            staleTime: 30_000
          });
          accounts = data.value ?? [];
        } catch {
          // If the fetch fails we still render the toast — names will just show as fallback.
        }

        const toastFn = tone === 'error' ? toast.error : toast.success;
        toastFn(title, {
          description: <PublishBatchToast message={message} targets={payload?.targets ?? []} accounts={accounts} />,
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
        queryClient.invalidateQueries({ queryKey: ['ai-recommendation-event-history'] });
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
