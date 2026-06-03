import { autoLinkSocialMediaToWorkspace } from '@/services/client/social-media.client';

const WORKSPACE_ID_KEY = 'meai:oauth:autoLinkWorkspaceId';
const PLATFORM_KEY = 'meai:oauth:autoLinkPlatform';
const RETURN_URL_KEY = 'meai:oauth:returnTo';
const GENERIC_RETURN_URL_KEY = 'meai:oauth:genericReturnTo';

export function stashOAuthAutoLinkIntent(params: {
  workspaceId: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads';
  returnTo: string;
}) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(WORKSPACE_ID_KEY, params.workspaceId);
  sessionStorage.setItem(PLATFORM_KEY, params.platform);
  sessionStorage.setItem(RETURN_URL_KEY, params.returnTo);
}

export function readOAuthAutoLinkIntent() {
  if (typeof window === 'undefined') return null;
  const workspaceId = sessionStorage.getItem(WORKSPACE_ID_KEY);
  const platform = sessionStorage.getItem(PLATFORM_KEY);
  const returnTo = sessionStorage.getItem(RETURN_URL_KEY);
  if (!workspaceId || !platform) return null;
  return { workspaceId, platform, returnTo };
}

export function clearOAuthAutoLinkIntent() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(WORKSPACE_ID_KEY);
  sessionStorage.removeItem(PLATFORM_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
}

export function stashOAuthReturnTo(returnTo: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GENERIC_RETURN_URL_KEY, returnTo);
}

export function consumeOAuthReturnTo() {
  if (typeof window === 'undefined') return null;
  const returnTo = sessionStorage.getItem(GENERIC_RETURN_URL_KEY);
  sessionStorage.removeItem(GENERIC_RETURN_URL_KEY);
  return returnTo;
}

export function clearOAuthReturnTo() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GENERIC_RETURN_URL_KEY);
}

// Post-builder editor continuation: capture in-flight caption state before an OAuth
// redirect so we can restore it + reopen the publish dialog once the user lands back.
const PUBLISH_CONTINUATION_KEY = 'meai:oauth:publishContinuation';
const PUBLISH_CONTINUATION_TTL_MS = 10 * 60 * 1000;

export type PublishContinuation = {
  builderId: string;
  platformContents: Record<string, Record<string, { text: string; html: string }>>;
  activePlatform: string | null;
  timestamp: number;
};

export function stashPublishContinuation(data: Omit<PublishContinuation, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PUBLISH_CONTINUATION_KEY,
    JSON.stringify({ ...data, timestamp: Date.now() } satisfies PublishContinuation)
  );
}

export function consumePublishContinuation(builderId: string): PublishContinuation | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PUBLISH_CONTINUATION_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PUBLISH_CONTINUATION_KEY);
  try {
    const parsed = JSON.parse(raw) as PublishContinuation;
    if (parsed.builderId !== builderId) return null;
    if (Date.now() - parsed.timestamp > PUBLISH_CONTINUATION_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// After an OAuth callback completes, ask the BE to link the connected provider
// account(s) to the stashed workspace. Silent on failure so callback UX continues.
export async function applyAutoLinkForStashedWorkspace(connectedSocialMediaId?: string | null): Promise<string | null> {
  const intent = readOAuthAutoLinkIntent();
  if (!intent) return null;

  try {
    await autoLinkSocialMediaToWorkspace(intent.workspaceId, {
      platform: intent.platform,
      socialMediaId: connectedSocialMediaId ?? null
    });
    return intent.returnTo;
  } catch {
    return intent.returnTo;
  } finally {
    clearOAuthAutoLinkIntent();
  }
}
