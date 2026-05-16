/**
 * Centralized React Query Keys
 * Single source of truth for all cache keys to prevent cache leaks
 */

export const AUTH_QUERY_KEYS = {
  all: () => ['auth'] as const,
  me: () => ['auth-me'] as const,
  sessions: () => ['auth', 'sessions'] as const,
};

export const USER_QUERY_KEYS = {
  all: () => ['user'] as const,
  detail: (id: string) => ['user', id] as const,
  settings: (id: string) => ['user', id, 'settings'] as const,
};

export const POST_QUERY_KEYS = {
  all: () => ['posts'] as const,
  detail: (id: string) => ['posts', id] as const,
  builders: () => ['post-builders'] as const,
  builder: (id: string) => ['post-builders', id] as const,
};

export const CHAT_QUERY_KEYS = {
  all: () => ['chats'] as const,
  detail: (id: string) => ['chats', id] as const,
  sessions: () => ['chat-sessions'] as const,
  session: (id: string) => ['chat-sessions', id] as const,
};

export const COIN_QUERY_KEYS = {
  pricing: () => ['coin-pricing'] as const,
  estimate: () => ['coin-pricing', 'estimate'] as const,
  history: () => ['coin-history'] as const,
};

export const WORKSPACE_QUERY_KEYS = {
  all: () => ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
};

export const NOTIFICATION_QUERY_KEYS = {
  all: () => ['notifications'] as const,
  unread: () => ['notifications', 'unread'] as const,
};

export const ADMIN_QUERY_KEYS = {
  all: () => ['admin'] as const,
  resources: () => ['admin', 'resources'] as const,
  config: () => ['admin', 'config'] as const,
};

export const SCHEDULE_QUERY_KEYS = {
  all: () => ['schedules'] as const,
  lists: () => ['schedules', 'list'] as const,
  list: (workspaceId?: string, status?: string) => 
    ['schedules', 'list', { workspaceId, status }] as const,
  detail: (id: string) => ['schedules', id] as const,
  status: (id: string) => ['schedules', id, 'status'] as const,
  byWorkspace: (workspaceId: string) => 
    ['schedules', 'workspace', workspaceId] as const,
};
