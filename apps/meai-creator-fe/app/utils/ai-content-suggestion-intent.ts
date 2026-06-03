export const AI_CONTENT_SUGGESTION_EVENT = 'meai:ai-content-suggestion-ready';
export const AI_CONTENT_SUGGESTION_STORAGE_KEY = 'meai:ai-content-suggestion-intent';

export type AiContentSuggestionIntent = {
  correlationId?: string | null;
  socialMediaId: string;
  workspaceId?: string | null;
  userPrompt?: string | null;
  style?: string | null;
  mediaType?: string | null;
  status?: string | null;
  platform?: string | null;
  errorMessage?: string | null;
  open?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(record: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
}

function isIntent(value: unknown): value is AiContentSuggestionIntent {
  if (!isRecord(value)) return false;
  return typeof value.socialMediaId === 'string' && value.socialMediaId.trim().length > 0;
}

export function hasAiContentSuggestionPrompt(intent: AiContentSuggestionIntent | null | undefined) {
  return typeof intent?.userPrompt === 'string' && intent.userPrompt.trim().length > 0;
}

export function parseAiContentSuggestionIntentFromPayload(
  payload: unknown,
  options: { open?: boolean } = {}
): AiContentSuggestionIntent | null {
  if (!isRecord(payload)) return null;

  const responseValue = payload.response ?? payload.Response;
  const response = isRecord(responseValue) ? responseValue : null;
  const socialMediaId = readString(payload, 'socialMediaId', 'SocialMediaId') ?? readString(response, 'SocialMediaId');

  if (!socialMediaId) return null;

  const userPrompt =
    readString(payload, 'userPrompt', 'UserPrompt', 'suggestion', 'Suggestion') ??
    readString(response, 'UserPrompt', 'userPrompt', 'Prompt', 'prompt', 'Suggestion', 'suggestion');

  return {
    correlationId: readString(payload, 'correlationId', 'CorrelationId') ?? readString(response, 'CorrelationId'),
    socialMediaId,
    workspaceId: readString(payload, 'workspaceId', 'WorkspaceId') ?? readString(response, 'WorkspaceId'),
    userPrompt,
    style: readString(payload, 'style', 'Style') ?? readString(response, 'Style'),
    mediaType: readString(payload, 'mediaType', 'MediaType') ?? readString(response, 'MediaType'),
    status: readString(payload, 'status', 'Status') ?? readString(response, 'Status'),
    platform: readString(payload, 'platform', 'Platform') ?? readString(response, 'Platform'),
    errorMessage: readString(payload, 'errorMessage', 'ErrorMessage') ?? readString(response, 'ErrorMessage'),
    open: options.open ?? false
  };
}

export function parseAiContentSuggestionIntentFromPayloadJson(
  raw: string | null,
  options: { open?: boolean } = {}
): AiContentSuggestionIntent | null {
  if (!raw) return null;

  try {
    return parseAiContentSuggestionIntentFromPayload(JSON.parse(raw), options);
  } catch {
    return null;
  }
}

export function storeAiContentSuggestionIntent(intent: AiContentSuggestionIntent) {
  if (typeof window === 'undefined') return;
  if (!hasAiContentSuggestionPrompt(intent)) return;
  window.sessionStorage.setItem(AI_CONTENT_SUGGESTION_STORAGE_KEY, JSON.stringify(intent));
}

export function readAiContentSuggestionIntent(): AiContentSuggestionIntent | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(AI_CONTENT_SUGGESTION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isIntent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAiContentSuggestionIntent() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(AI_CONTENT_SUGGESTION_STORAGE_KEY);
}

export function dispatchAiContentSuggestionIntent(intent: AiContentSuggestionIntent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AI_CONTENT_SUGGESTION_EVENT, { detail: intent }));
}
