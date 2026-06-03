import { useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import envConfig from '@/config';
import type {
  AiDraftPostGenerationPayload,
  NotificationDelivery,
  NotificationListResponse
} from '@/models/notification.model';
import { NotificationTypes } from '@/models/notification.model';
import type {
  AiAccountAnalysisSuggestionPayload,
  AiAccountAnalysisSuggestionStatusResponse
} from '@/models/ai-recommendation.model';
import type { SocialMedia, SocialMediaListResponse } from '@/models/social-media.model';
import type { AiPostImproveResponse, AiPostImproveRealtimePayload } from '@/models/post.model';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import PublishBatchToast from '@/components/notifications/PublishBatchToast';
import { useGenerationFailureStore } from '@/store/generation-failure.store';
import {
  isAiDraftPostGenerationNotification,
  useAiRecommendationEventStore
} from '@/store/ai-recommendation-events.store';
import {
  dispatchAiContentSuggestionIntent,
  hasAiContentSuggestionPrompt,
  parseAiContentSuggestionIntentFromPayloadJson,
  storeAiContentSuggestionIntent
} from '@/utils/ai-content-suggestion-intent';

const HUB_URL = `${envConfig.VITE_API_URL}/hubs/notifications`;
const NOTIFICATION_RECEIVED = 'NotificationReceived';
const RECONNECT_DELAYS = [0, 2000, 5000, 10000];
const REALTIME_TRANSPORTS = HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents;

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
  return [
    payload?.correlationId,
    payload?.postId,
    payload?.draftPostId,
    payload?.originalPostId,
    payload?.recommendPostId
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function collectImprovePostIds(payload: AiDraftPostGenerationPayload | null) {
  return Array.from(
    new Set(
      [payload?.originalPostId, payload?.postId].filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )
    )
  );
}

function collectResultPostIds(payload: AiDraftPostGenerationPayload | null) {
  return [payload?.postId, payload?.draftPostId].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
}

function upsertNotificationCache(queryClient: QueryClient, notification: NotificationDelivery) {
  queryClient.setQueriesData<NotificationListResponse>({ queryKey: ['notifications'] }, (current) => {
    if (!current) return current;

    const existing = current.value ?? [];
    const alreadyCached = existing.some(
      (item) =>
        item.userNotificationId === notification.userNotificationId ||
        item.notificationId === notification.notificationId
    );

    if (alreadyCached) return current;

    return {
      ...current,
      value: [notification, ...existing].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
    };
  });
}

function syncActiveQueries(queryClient: QueryClient, queryKey: readonly unknown[]) {
  void queryClient.invalidateQueries({ queryKey });
  void queryClient.refetchQueries({ queryKey, type: 'active' });
}

export function useNotificationHub(enabled: boolean) {
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef('');
  const queryClient = useQueryClient();

  const getAccessToken = useCallback(async () => {
    try {
      const token = await fetchAccessToken();
      tokenRef.current = token;
      return token;
    } catch (err) {
      console.error('[NotificationHub] Token fetch failed:', err);
      return tokenRef.current;
    }
  }, []);

  const handleNotification = useCallback(
    (notification: NotificationDelivery) => {
      upsertNotificationCache(queryClient, notification);

      if (
        notification.type === 'ai.publishing_schedule.thinking' ||
        notification.type === 'ai.publishing_schedule.completed' ||
        notification.type === 'ai.publishing_schedule.failed'
      ) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ai-publishing-schedule-update', { detail: notification }));
        }
      }

      if (isAiDraftPostGenerationNotification(notification.type)) {
        useAiRecommendationEventStore.getState().upsertNotification(notification);

        const payload = parsePayload<AiDraftPostGenerationPayload>(notification.payloadJson);
        const taskIds = collectTaskIds(payload);
        const resultPostIds = collectResultPostIds(payload);
        const isCompletedNotification = notification.type === NotificationTypes.AiDraftPostGenerationCompleted;
        const isResultNotification =
          isCompletedNotification || notification.type === NotificationTypes.AiDraftPostGenerationFailed;
        const isPostImproveNotification = notification.type.startsWith('ai.post_improve.');
        const isPostImproveThinking = notification.type === NotificationTypes.AiPostImproveThinking;

        for (const id of taskIds) {
          queryClient.invalidateQueries({ queryKey: ['ai-recommendation-task', id] });
        }
        if (isPostImproveNotification && !isPostImproveThinking) {
          for (const id of collectImprovePostIds(payload)) {
            queryClient.invalidateQueries({ queryKey: ['ai-post-improve', id] });
          }
        }

        if (isResultNotification) {
          for (const id of taskIds) {
            queryClient.refetchQueries({ queryKey: ['ai-recommendation-task', id] });
          }
          for (const id of collectImprovePostIds(payload)) {
            queryClient.refetchQueries({ queryKey: ['ai-post-improve', id] });
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
        notification.type === NotificationTypes.AiImageGenerationSubmitted ||
        notification.type === NotificationTypes.AiVideoGenerationSubmitted
      ) {
        syncActiveQueries(queryClient, ['workspace-chats']);
      }

      if (
        notification.type === NotificationTypes.AiImageGenerationCompleted ||
        notification.type === NotificationTypes.AiVideoGenerationCompleted
      ) {
        syncActiveQueries(queryClient, ['resources']);
        syncActiveQueries(queryClient, ['storage-usage']);
        syncActiveQueries(queryClient, ['workspace-chats']);
      }

      if (
        notification.type === NotificationTypes.SocialMediaPostSyncCompleted ||
        notification.type === NotificationTypes.SocialMediaPostSyncFailed
      ) {
        syncActiveQueries(queryClient, ['posts']);
        syncActiveQueries(queryClient, ['resources']);
        syncActiveQueries(queryClient, ['storage-usage']);
        syncActiveQueries(queryClient, ['post-edit-resources']);
        syncActiveQueries(queryClient, ['media-modal-resources']);
        syncActiveQueries(queryClient, ['dialog-import-user-media-resources']);
      }

      if (
        notification.type === NotificationTypes.AiImageGenerationFailed ||
        notification.type === NotificationTypes.AiVideoGenerationFailed
      ) {
        toast.error(notification.title || 'Generation failed', {
          description: notification.message
        });
        syncActiveQueries(queryClient, ['workspace-chats']);

        // Reframe variant failures don't mark the parent chat as Failed — BE intentionally
        // leaves the chat alive. Track per-parent failed-variant counts so the item can drop
        // its pending skeletons instead of spinning forever.
        const payload = parsePayload<{ parentCorrelationId?: string }>(notification.payloadJson);
        const parent = payload?.parentCorrelationId;
        if (typeof parent === 'string' && parent) {
          useGenerationFailureStore.getState().incrementFailed(parent);
        }
      }

      const POST_IMPROVE_TYPES = new Set([
        NotificationTypes.AiPostImproveSubmitted,
        NotificationTypes.AiPostImproveProcessing,
        NotificationTypes.AiPostImproveCompleted,
        NotificationTypes.AiPostImproveFailed
      ]);

      if (POST_IMPROVE_TYPES.has(notification.type as any)) {
        let improvePayload: AiPostImproveRealtimePayload | null = null;
        try {
          improvePayload = notification.payloadJson ? JSON.parse(notification.payloadJson) : null;
        } catch {
          /* empty */
        }

        const targetPostId = improvePayload?.postId || improvePayload?.originalPostId;

        if (improvePayload && targetPostId) {
          queryClient.setQueryData<AiPostImproveResponse>(['ai-post-improve', targetPostId], {
            isSuccess: true,
            isFailure: false,
            error: null,
            value: improvePayload
          });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }

        if (notification.type === NotificationTypes.AiPostImproveFailed) {
          toast.error(notification.title || 'AI Improvement Failed', {
            description: improvePayload?.errorMessage || notification.message
          });
        }

        return;
      }

      const ACCOUNT_ANALYSIS_TYPES = new Set([
        NotificationTypes.AiAccountAnalysisSuggestionProcessing,
        NotificationTypes.AiAccountAnalysisSuggestionCompleted,
        NotificationTypes.AiAccountAnalysisSuggestionFailed
      ]);

      if (ACCOUNT_ANALYSIS_TYPES.has(notification.type as any)) {
        const payload = parsePayload<AiAccountAnalysisSuggestionPayload>(notification.payloadJson);
        const socialMediaId = payload?.socialMediaId;

        if (payload && socialMediaId) {
          const statusResponse: AiAccountAnalysisSuggestionStatusResponse = {
            isSuccess: true,
            isFailure: false,
            error: null,
            value: {
              socialMediaId,
              platform: payload.platform,
              status: payload.status,
              isSuggested: payload.isSuggested,
              correlationId: payload.correlationId,
              suggestion: payload.suggestion,
              generatedAt: payload.generatedAt,
              completedAt: payload.completedAt,
              errorCode: payload.errorCode,
              errorMessage: payload.errorMessage
            }
          };

          queryClient.setQueryData<AiAccountAnalysisSuggestionStatusResponse>(
            ['account-analysis-suggestion', socialMediaId],
            statusResponse
          );
          queryClient.invalidateQueries({ queryKey: ['account-analysis-suggestion', socialMediaId] });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ai-account-analysis-suggestion-update', { detail: notification }));
          }
        }

        if (notification.type === NotificationTypes.AiAccountAnalysisSuggestionCompleted) {
          toast.success(notification.title || 'Account analysis ready', {
            description: notification.message
          });
        } else if (notification.type === NotificationTypes.AiAccountAnalysisSuggestionFailed) {
          toast.error(notification.title || 'Account analysis failed', {
            description: payload?.errorMessage || notification.message
          });
        }

        return;
      }

      const CONTENT_SUGGESTION_TYPES = new Set([
        NotificationTypes.AiContentSuggestionCompleted,
        NotificationTypes.AiContentSuggestionFailed
      ]);

      if (CONTENT_SUGGESTION_TYPES.has(notification.type as any)) {
        const intent = parseAiContentSuggestionIntentFromPayloadJson(notification.payloadJson, { open: false });

        if (intent) {
          if (hasAiContentSuggestionPrompt(intent)) {
            storeAiContentSuggestionIntent(intent);
          }

          dispatchAiContentSuggestionIntent(intent);
        }

        if (notification.type === NotificationTypes.AiContentSuggestionFailed) {
          toast.error(notification.title || 'Content suggestion failed', {
            description: intent?.errorMessage || notification.message
          });
        }

        return;
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
        socialMediaId?: string;
        socialMediaType?: string;
        destinations?: Array<{ pageId?: string | null }>;
        errorCode?: string;
        errorMessage?: string;
        targets?: Array<{
          socialMediaId: string;
          socialMediaType: string;
          destinationOwnerId?: string | null;
          status: string;
        }>;
      };
      const payload = parsePayload<BatchPayload>(notification.payloadJson);

      // Every publish-flow notification should refresh the post-builder so banners + per-target
      // state reconcile with BE. Refetch in addition to invalidate so active queries bypass staleTime.
      queryClient.invalidateQueries({ queryKey: ['post-builder'] });
      queryClient.refetchQueries({ queryKey: ['post-builder'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.refetchQueries({ queryKey: ['posts'] });

      const showTargetToast = async (
        tone: 'success' | 'error',
        title: string,
        message: string,
        targets: NonNullable<BatchPayload['targets']>
      ) => {
        if (targets.length === 0) {
          if (tone === 'error') toast.error(title, { description: message });
          else toast.success(title, { description: message });
          return;
        }

        let accounts: SocialMedia[] = [];
        try {
          const data = await queryClient.ensureQueryData<SocialMediaListResponse>({
            queryKey: ['social-medias-publish'],
            queryFn: () => fetchSocialMedias(),
            staleTime: 30_000
          });
          accounts = data.value ?? [];
        } catch {
          // The platform fallback still identifies the target when account lookup fails.
        }

        const toastFn = tone === 'error' ? toast.error : toast.success;
        toastFn(title, {
          description: <PublishBatchToast message={message} targets={targets} accounts={accounts} />,
          duration: 6000
        });
      };

      // Publish success notifications are emitted per destination account. Split older payloads
      // too so a rolling FE/BE deployment never regresses to a multi-account toast.
      if (notification.type === NotificationTypes.PostPublishTargetCompleted) {
        const destinations = payload?.destinations?.length ? payload.destinations : [undefined];
        for (const destination of destinations) {
          const targets =
            payload?.socialMediaId && payload.socialMediaType
              ? [
                  {
                    socialMediaId: payload.socialMediaId,
                    socialMediaType: payload.socialMediaType,
                    destinationOwnerId: destination?.pageId,
                    status: 'published'
                  }
                ]
              : [];
          void showTargetToast('success', notification.title || 'Post published', notification.message ?? '', targets);
        }
        return;
      }

      if (
        notification.type === NotificationTypes.PostPublishTargetFailed ||
        notification.type === NotificationTypes.PostPublishTargetRolledBack ||
        notification.type === NotificationTypes.PostUnpublishTargetFailed ||
        notification.type === NotificationTypes.PostUpdateTargetFailed
      ) {
        console.error('[NotificationHub] publish-flow target failed:', {
          type: notification.type,
          socialMediaType: payload?.socialMediaType,
          errorCode: payload?.errorCode,
          errorMessage: payload?.errorMessage,
          raw: notification
        });
        const targets =
          payload?.socialMediaId && payload.socialMediaType
            ? [
                {
                  socialMediaId: payload.socialMediaId,
                  socialMediaType: payload.socialMediaType,
                  status: 'failed'
                }
              ]
            : [];
        void showTargetToast(
          'error',
          notification.title || 'Failed',
          payload?.errorMessage || notification.message || 'Publishing failed.',
          targets
        );
        return;
      }

      // Kept for compatibility with already stored notifications, but publish batches are not
      // user-facing: per-target events provide the account identity and exact failure reason.
      if (notification.type === NotificationTypes.PostPublishBatchCompleted) {
        return;
      }

      if (
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

      void showTargetToast(tone, title, message, payload.targets);
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let disposed = false;

    (async () => {
      const token = await getAccessToken();
      if (disposed || !token) return;

      const connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: getAccessToken,
          withCredentials: true,
          transport: REALTIME_TRANSPORTS
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
  }, [enabled, getAccessToken, handleNotification, queryClient]);
}
