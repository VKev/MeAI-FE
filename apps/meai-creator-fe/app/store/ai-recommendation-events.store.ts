import { create } from 'zustand';
import {
  NotificationTypes,
  type AiDraftPostGenerationPayload,
  type NotificationDelivery
} from '@/models/notification.model';

export type AiRecommendationThinkingStatus = 'queued' | 'processing' | 'done' | 'failed' | 'warning' | 'info';

export type AiRecommendationThinkingItem = {
  id: string;
  action: string;
  status: AiRecommendationThinkingStatus;
  title: string;
  description: string;
  details: unknown;
  createdAt: string;
  notificationType: string;
};

export type AiRecommendationTimelineStatus = 'submitted' | 'processing' | 'completed' | 'failed';

export type AiRecommendationTimeline = {
  correlationId: string | null;
  postId: string | null;
  resultPostId: string | null;
  resultResourceId: string | null;
  resultPresignedUrl: string | null;
  resultCaption: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  status: AiRecommendationTimelineStatus;
  items: AiRecommendationThinkingItem[];
  updatedAt: string;
};

type AiRecommendationEventState = {
  timelines: Record<string, AiRecommendationTimeline>;
  aliases: Record<string, string>;
  upsertNotification: (notification: NotificationDelivery) => void;
  clearTimeline: (id: string) => void;
};

const AI_RECOMMENDATION_TIMELINE_TYPES = new Set<string>([
  NotificationTypes.AiDraftPostGenerationSubmitted,
  NotificationTypes.AiDraftPostGenerationThinking,
  NotificationTypes.AiDraftPostGenerationCompleted,
  NotificationTypes.AiDraftPostGenerationFailed,
  NotificationTypes.AiPostImproveSubmitted,
  NotificationTypes.AiPostImproveThinking,
  NotificationTypes.AiPostImproveProcessing,
  NotificationTypes.AiPostImproveCompleted,
  NotificationTypes.AiPostImproveFailed
]);

const HIDDEN_ACTIONS = new Set<string>(['rag_ready_wait_started', 'rag_ready_wait_completed']);
const REPLACE_BY_ACTIONS = new Set<string>(['account_posts_reading_started']);

const ACTION_TITLES: Record<string, string> = {
  account_posts_reading_batch: 'AI is updating RAG knowledge',
  rag_account_context_indexing_batch: 'AI is updating RAG knowledge'
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  account_posts_reading_batch: 'AI is indexing page profile and account post context for retrieval.',
  rag_account_context_indexing_batch: 'AI is indexing page profile and account post context for retrieval.'
};

function parsePayload(raw: string | null): AiDraftPostGenerationPayload {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as AiDraftPostGenerationPayload;
  } catch {
    return {};
  }
}

function normalizeId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function collectAliases(payload: AiDraftPostGenerationPayload) {
  return [
    normalizeId(payload.correlationId),
    normalizeId(payload.postId),
    normalizeId(payload.draftPostId),
    normalizeId(payload.originalPostId),
    normalizeId(payload.recommendPostId)
  ].filter((value): value is string => Boolean(value));
}

function resolveTimelineKey(
  aliases: Record<string, string>,
  payload: AiDraftPostGenerationPayload,
  notification: NotificationDelivery
) {
  for (const alias of collectAliases(payload)) {
    const existing = aliases[alias];
    if (existing) return existing;
  }

  return (
    normalizeId(payload.correlationId) ??
    normalizeId(payload.postId) ??
    normalizeId(payload.draftPostId) ??
    normalizeId(payload.originalPostId) ??
    normalizeId(payload.recommendPostId) ??
    notification.notificationId
  );
}

function normalizeItemStatus(notificationType: string, phaseStatus?: string | null): AiRecommendationThinkingStatus {
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationSubmitted ||
    notificationType === NotificationTypes.AiPostImproveSubmitted
  )
    return 'queued';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationCompleted ||
    notificationType === NotificationTypes.AiPostImproveCompleted
  )
    return 'done';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationFailed ||
    notificationType === NotificationTypes.AiPostImproveFailed
  )
    return 'failed';

  const normalized = phaseStatus?.toLowerCase();
  if (normalized === 'completed' || normalized === 'done') return 'done';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'warning') return 'warning';
  if (normalized === 'info' || normalized === 'notice') return 'info';
  if (normalized === 'queued' || normalized === 'submitted') return 'queued';
  return 'processing';
}

function normalizeTimelineStatus(
  notificationType: string,
  payload: AiDraftPostGenerationPayload,
  previous?: AiRecommendationTimeline
): AiRecommendationTimelineStatus {
  const phaseStatus = payload.phaseStatus?.toLowerCase();
  const normalized = (payload.taskStatus ?? payload.status ?? '').toLowerCase();
  const isPreviousTerminal = previous?.status === 'completed' || previous?.status === 'failed';
  const isNextTerminal =
    notificationType === NotificationTypes.AiDraftPostGenerationCompleted ||
    notificationType === NotificationTypes.AiDraftPostGenerationFailed ||
    notificationType === NotificationTypes.AiPostImproveCompleted ||
    notificationType === NotificationTypes.AiPostImproveFailed ||
    phaseStatus === 'failed' ||
    normalized === 'completed' ||
    normalized === 'failed';

  if (isPreviousTerminal && !isNextTerminal) {
    return previous.status;
  }

  if (
    notificationType === NotificationTypes.AiDraftPostGenerationSubmitted ||
    notificationType === NotificationTypes.AiPostImproveSubmitted
  )
    return 'submitted';
  if (notificationType === NotificationTypes.AiPostImproveProcessing) return 'processing';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationCompleted ||
    notificationType === NotificationTypes.AiPostImproveCompleted
  )
    return 'completed';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationFailed ||
    notificationType === NotificationTypes.AiPostImproveFailed
  )
    return 'failed';

  if (phaseStatus === 'failed') return 'failed';

  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'submitted') return 'submitted';
  return previous?.status === 'submitted' ? 'processing' : (previous?.status ?? 'processing');
}

function normalizeAction(notificationType: string, payload: AiDraftPostGenerationPayload) {
  const explicitAction = normalizeId(payload.action);
  if (explicitAction) return explicitAction;
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationFailed ||
    notificationType === NotificationTypes.AiPostImproveFailed
  )
    return 'generation_failed';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationCompleted ||
    notificationType === NotificationTypes.AiPostImproveCompleted
  )
    return 'generation_completed';
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationSubmitted ||
    notificationType === NotificationTypes.AiPostImproveSubmitted
  )
    return 'generation_submitted';
  if (notificationType === NotificationTypes.AiPostImproveProcessing) return 'generation_started';
  return notificationType;
}

function isCompletionNotificationType(notificationType: string) {
  if (
    notificationType === NotificationTypes.AiDraftPostGenerationCompleted ||
    notificationType === NotificationTypes.AiPostImproveCompleted
  ) {
    return true;
  }

  return false;
}

function getActionGroup(action: string) {
  if (action === 'draft_post_finalized') return 'draft_post_finalizing';
  if (action === 'improve_post_finalized') return 'improve_post_finalizing';
  if (action === 'account_posts_indexing_completed') return 'account_posts_reading';

  const imagePhaseMatch = action.match(/^(image_generation)_(started|completed)_(\d+)$/);
  if (imagePhaseMatch) {
    return `${imagePhaseMatch[1]}_${imagePhaseMatch[3]}`;
  }

  return action
    .replace(/_(started|completed|failed|skipped|finalized)$/i, '')
    .replace(/_finalizing$/i, '_finalizing');
}

function buildItem(
  notification: NotificationDelivery,
  payload: AiDraftPostGenerationPayload
): AiRecommendationThinkingItem | null {
  const action = normalizeAction(notification.type, payload);
  const hasExplicitAction = Boolean(normalizeId(payload.action));
  if (
    notification.type === NotificationTypes.AiDraftPostGenerationSubmitted ||
    notification.type === NotificationTypes.AiPostImproveSubmitted ||
    notification.type === NotificationTypes.AiPostImproveProcessing ||
    (isCompletionNotificationType(notification.type) && !hasExplicitAction) ||
    HIDDEN_ACTIONS.has(action)
  ) {
    return null;
  }

  return {
    id: notification.notificationId,
    action,
    status: normalizeItemStatus(notification.type, payload.phaseStatus),
    title: (ACTION_TITLES[action] ?? notification.title) || action.replaceAll('_', ' '),
    description: ACTION_DESCRIPTIONS[action] ?? notification.message,
    details: payload.details ?? payload,
    createdAt: payload.createdAt ?? notification.createdAt,
    notificationType: notification.type
  };
}

function mergeItems(items: AiRecommendationThinkingItem[], next: AiRecommendationThinkingItem) {
  const nextActionGroup = getActionGroup(next.action);
  const existingActionItem = items.find((item) => getActionGroup(item.action) === nextActionGroup);
  const mergedNext = existingActionItem
    ? {
        ...next,
        id: existingActionItem.id,
        createdAt: existingActionItem.createdAt
      }
    : next;
  const withoutDuplicate = items.filter(
    (item) =>
      item.id !== mergedNext.id &&
      getActionGroup(item.action) !== nextActionGroup &&
      !(mergedNext.action === 'generation_failed' && item.status === 'failed') &&
      !(REPLACE_BY_ACTIONS.has(mergedNext.action) && item.action === mergedNext.action)
  );
  const sorted = [...withoutDuplicate, mergedNext].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (mergedNext.status === 'failed') {
    const started = sorted.find((item) => item.action === 'generation_started');
    const terminal = { ...mergedNext, status: 'failed' as const };
    const terminalItems: AiRecommendationThinkingItem[] = [];
    if (started) {
      terminalItems.push({ ...started, status: 'done' as const });
    }
    terminalItems.push(terminal);
    return terminalItems;
  }

  const latestIndex = sorted.length - 1;

  return sorted.map((item, index) => {
    if (index < latestIndex && (item.status === 'processing' || item.status === 'queued')) {
      return { ...item, status: 'done' as const };
    }

    return item;
  });
}

function finalizeTimelineItems(
  items: AiRecommendationThinkingItem[],
  status: AiRecommendationTimelineStatus
): AiRecommendationThinkingItem[] {
  if (status === 'completed') {
    return items.map((item) =>
      item.status === 'processing' || item.status === 'queued' ? { ...item, status: 'done' as const } : item
    );
  }

  if (status !== 'failed') {
    return items;
  }

  const hasFailedItem = items.some((item) => item.status === 'failed');
  if (hasFailedItem || items.length === 0) {
    return items;
  }

  const latestIndex = items.length - 1;
  return items.map((item, index) => (index === latestIndex ? { ...item, status: 'failed' as const } : item));
}

export function isAiDraftPostGenerationNotification(type: string) {
  return AI_RECOMMENDATION_TIMELINE_TYPES.has(type);
}

export function selectAiRecommendationTimeline(
  state: AiRecommendationEventState,
  ids: Array<string | null | undefined>
) {
  for (const rawId of ids) {
    const id = normalizeId(rawId);
    if (!id) continue;

    const key = state.aliases[id] ?? id;
    const timeline = state.timelines[key];
    if (timeline) return timeline;
  }

  return null;
}

export const useAiRecommendationEventStore = create<AiRecommendationEventState>((set) => ({
  timelines: {},
  aliases: {},
  upsertNotification: (notification) => {
    if (!isAiDraftPostGenerationNotification(notification.type)) return;

    const payload = parsePayload(notification.payloadJson);
    set((state) => {
      const key = resolveTimelineKey(state.aliases, payload, notification);
      const previous = state.timelines[key];
      const aliases = { ...state.aliases };
      for (const alias of collectAliases(payload)) {
        aliases[alias] = key;
      }

      const postId =
        normalizeId(payload.postId) ??
        normalizeId(payload.originalPostId) ??
        normalizeId(payload.draftPostId) ??
        previous?.postId ??
        null;
      const item = buildItem(notification, payload);
      const nextStatus = normalizeTimelineStatus(notification.type, payload, previous);
      const mergedItems = item ? mergeItems(previous?.items ?? [], item) : (previous?.items ?? []);
      const timeline: AiRecommendationTimeline = {
        correlationId: normalizeId(payload.correlationId) ?? previous?.correlationId ?? null,
        postId,
        resultPostId: postId ?? previous?.resultPostId ?? null,
        resultResourceId:
          normalizeId(payload.resourceId) ?? normalizeId(payload.resultResourceId) ?? previous?.resultResourceId ?? null,
        resultPresignedUrl:
          normalizeId(payload.presignedUrl) ??
          normalizeId(payload.resultPresignedUrl) ??
          previous?.resultPresignedUrl ??
          null,
        resultCaption: payload.caption ?? payload.resultCaption ?? previous?.resultCaption ?? null,
        errorCode: payload.errorCode ?? previous?.errorCode ?? null,
        errorMessage: payload.errorMessage ?? previous?.errorMessage ?? null,
        status: nextStatus,
        items: finalizeTimelineItems(mergedItems, nextStatus),
        updatedAt: notification.updatedAt ?? notification.createdAt
      };

      return {
        aliases,
        timelines: {
          ...state.timelines,
          [key]: timeline
        }
      };
    });
  },
  clearTimeline: (id) =>
    set((state) => {
      const key = state.aliases[id] ?? id;
      if (!state.timelines[key]) return state;

      const timelines = { ...state.timelines };
      delete timelines[key];

      const aliases = Object.fromEntries(Object.entries(state.aliases).filter(([, value]) => value !== key));
      return { timelines, aliases };
    })
}));
