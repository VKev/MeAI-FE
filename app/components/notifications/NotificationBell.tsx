import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ChevronDown, Image as ImageIcon, Send, Video } from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '@/services/client/notification.client';
import { NotificationBellHiddenTypes, NotificationTypes, type NotificationDelivery } from '@/models/notification.model';
import { fetchSocialMedias } from '@/services/client/social-media.client';
import type { SocialMedia } from '@/models/social-media.model';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import { cn } from '@/lib/utils';

type Variant = 'header' | 'sidebar';

type Props = {
  variant?: Variant;
  side?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
};

// Noisy events the user doesn't want in the bell dropdown: "start of something" placeholders
// and per-target success events that are already summarized by their batch_completed sibling.
const HIDDEN_TYPES = NotificationBellHiddenTypes;

const FAILURE_TYPES = new Set<string>([
  NotificationTypes.PostPublishTargetFailed,
  NotificationTypes.PostPublishTargetRolledBack,
  NotificationTypes.PostUnpublishTargetFailed,
  NotificationTypes.PostUpdateTargetFailed,
  NotificationTypes.AiImageGenerationFailed,
  NotificationTypes.AiVideoGenerationFailed,
  NotificationTypes.AiDraftPostGenerationFailed
]);

const BATCH_TYPES = new Set<string>([
  NotificationTypes.PostPublishBatchCompleted,
  NotificationTypes.PostUnpublishBatchCompleted,
  NotificationTypes.PostUpdateBatchCompleted
]);

const PLATFORM_ICON: Record<string, ComponentType<{ size?: number; color?: string; className?: string }>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  ig: InstagramIcon,
  tiktok: TiktokIcon,
  threads: ThreadsIcon,
  thread: ThreadsIcon
};

const PLATFORM_BG: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-pink-500 to-amber-500',
  ig: 'bg-gradient-to-br from-pink-500 to-amber-500',
  tiktok: 'bg-black',
  threads: 'bg-black',
  thread: 'bg-black'
};

function iconFor(type: string) {
  if (type.startsWith('ai.image_generation')) return ImageIcon;
  if (type.startsWith('ai.video_generation')) return Video;
  if (type.startsWith('post.')) return Send;
  return Bell;
}

function toneFor(type: string): string {
  if (FAILURE_TYPES.has(type)) return 'text-rose-300 bg-rose-500/10';
  if (type.startsWith('ai.')) return 'text-violet-300 bg-violet-500/10';
  if (type.startsWith('post.')) return 'text-sky-300 bg-sky-500/10';
  return 'text-zinc-300 bg-white/5';
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type AccountDisplay = { name: string; avatar: string | null };

function getAccountDisplay(account: SocialMedia | undefined): AccountDisplay {
  if (!account) return { name: 'Unknown account', avatar: null };
  const profile = account.profile;
  if (!profile) return { name: account.type ?? 'Unknown', avatar: null };
  const type = account.type?.toLowerCase();
  if (type === 'facebook') {
    return {
      name: profile.pageName || profile.displayName || 'Facebook Page',
      avatar: profile.pageProfilePictureUrl || profile.profilePictureUrl || null
    };
  }
  return {
    name: profile.displayName || profile.username || account.type || 'Account',
    avatar: profile.profilePictureUrl || null
  };
}

type BatchTarget = {
  socialMediaId: string;
  socialMediaType: string;
  destinationOwnerId?: string | null;
  status: string;
};

type ParsedPayload = {
  targets?: BatchTarget[];
  socialMediaId?: string;
  socialMediaType?: string;
  destinations?: Array<{ pageId?: string; externalContentId?: string }>;
  errorCode?: string;
  errorMessage?: string;
  finalStatus?: string;
};

function parsePayload(raw: string | null): ParsedPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedPayload;
  } catch {
    return null;
  }
}

function statusRingClass(status: string | undefined): string {
  if (status === 'published') return 'ring-emerald-400/60';
  if (status === 'draft') return 'ring-zinc-400/60';
  return 'ring-red-400/60';
}

type TargetChipProps = {
  account: SocialMedia | undefined;
  platformType: string | undefined;
  status?: string;
};

function TargetChip({ account, platformType, status }: TargetChipProps) {
  const display = getAccountDisplay(account);
  const type = (platformType ?? '').toLowerCase();
  const PlatformIcon = PLATFORM_ICON[type];
  const platformBg = PLATFORM_BG[type] ?? 'bg-zinc-700';
  const ringClass = statusRingClass(status);

  return (
    <div
      className='flex items-center gap-1.5 rounded-md border border-zinc-700/80 bg-zinc-900/70 px-1.5 py-0.5'
      title={status ? `${display.name} — ${status}` : display.name}
    >
      <div className='relative'>
        {display.avatar ? (
          <img src={display.avatar} alt='' className={cn('size-5 rounded-full object-cover ring-2', ringClass)} />
        ) : (
          <div
            className={cn(
              'flex size-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] text-zinc-300 ring-2',
              ringClass
            )}
          >
            {display.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {PlatformIcon && (
          <span
            className={cn(
              'absolute -left-1 -top-1 flex size-3 items-center justify-center rounded-full ring-1 ring-zinc-950',
              platformBg
            )}
          >
            <PlatformIcon size={7} color='white' />
          </span>
        )}
      </div>
      <span className='max-w-28 truncate text-[11px] text-zinc-200'>{display.name}</span>
    </div>
  );
}

const PAGE_SIZE = 10;
const FETCH_LIMIT = 100;

export default function NotificationBell({
  variant = 'header',
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
  alignOffset = 0
}: Props) {
  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: FETCH_LIMIT }),
    staleTime: 30_000
  });

  // Fetch the user's social accounts so we can resolve avatars + page names for social-
  // related notifications. Shared key with the publish dialog so nothing is duplicated.
  const { data: socialData } = useQuery({
    queryKey: ['social-medias-publish'],
    queryFn: () => fetchSocialMedias()
  });

  const accountsById = useMemo(() => {
    const map = new Map<string, SocialMedia>();
    for (const account of socialData?.value ?? []) map.set(account.id, account);
    return map;
  }, [socialData]);

  // Map FB/IG destination ids (page id, ig user id) → SocialMedia row. Publish fans out to
  // every page the user token sees but stamps every resulting publication with the SAME
  // source SocialMediaId, so we need a second index to resolve the actual page-specific
  // avatar + pageName for each target in the batch notification.
  const accountsByPageId = useMemo(() => {
    const map = new Map<string, SocialMedia>();
    for (const account of socialData?.value ?? []) {
      const pageId = account.profile?.pageId?.trim();
      if (pageId) map.set(pageId, account);
    }
    return map;
  }, [socialData]);

  function resolveAccount(target: BatchTarget | undefined, fallbackSocialMediaId?: string): SocialMedia | undefined {
    const destinationId = target?.destinationOwnerId?.trim();
    if (destinationId) {
      const byPage = accountsByPageId.get(destinationId);
      if (byPage) return byPage;
    }
    const smId = target?.socialMediaId ?? fallbackSocialMediaId;
    return smId ? accountsById.get(smId) : undefined;
  }

  // Filter out noisy "start of" events and redundant per-target success events — only
  // keep finished/final notifications + per-target failures.
  const allItems: NotificationDelivery[] = useMemo(
    () => (data?.value ?? []).filter((n) => !HIDDEN_TYPES.has(n.type)),
    [data]
  );
  const items = allItems.slice(0, visibleCount);
  const unreadCount = allItems.filter((n) => !n.isRead).length;
  const hasMore = allItems.length > visibleCount;

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const badge =
    unreadCount > 0 ? (
      <span className='absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-zinc-950'>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    ) : null;

  const trigger =
    variant === 'sidebar' ? (
      <button
        type='button'
        aria-label='Notifications'
        className='relative mx-auto flex w-full cursor-pointer items-center justify-center rounded-2xl border border-white/10 px-1 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8 hover:text-white'
      >
        <Bell className='size-5' />
        {badge}
      </button>
    ) : (
      <button
        type='button'
        aria-label='Notifications'
        className='relative flex size-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/85 transition hover:bg-white/8 hover:text-white'
      >
        <Bell className='size-5' />
        {badge}
      </button>
    );

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        style={{ zIndex: 9999, backgroundColor: '#09090b' }}
        className='w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 p-0 text-white shadow-2xl'
      >
        <div className='flex items-center justify-between border-b border-white/8 bg-zinc-950 px-4 py-3'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold text-white'>Notifications</h3>
            {unreadCount > 0 && (
              <span className='inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300'>
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            type='button'
            onClick={() => {
              if (unreadCount === 0 || markAll.isPending) return;
              markAll.mutate();
            }}
            disabled={unreadCount === 0 || markAll.isPending}
            className='flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
          >
            <CheckCheck className='size-3.5' />
            Mark all read
          </button>
        </div>

        <div className='max-h-[26rem] overflow-y-auto bg-zinc-950'>
          {isLoading ? (
            <div className='flex items-center justify-center py-10 text-xs text-white/50'>Loading…</div>
          ) : items.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
              <Bell className='size-5 text-white/30' />
              <p className='text-xs text-white/50'>You're all caught up.</p>
            </div>
          ) : (
            <ul className='divide-y divide-white/5'>
              {items.map((n) => {
                const Icon = iconFor(n.type);
                const toneClass = toneFor(n.type);
                const payload = parsePayload(n.payloadJson);
                const isBatch = BATCH_TYPES.has(n.type);
                const targets = isBatch ? (payload?.targets ?? []) : [];
                // Per-target (non-batch) events: try to resolve the specific page when the
                // payload includes destinations[] (publish success) — otherwise fall back to
                // the source SocialMediaId lookup. We ALWAYS render the chip when there's a
                // socialMediaType in the payload (even if the account lookup misses), so the
                // user at least sees the platform icon + fallback label instead of a bare
                // failure row with no context.
                const hasSingleTargetContext = !isBatch && (payload?.socialMediaId || payload?.socialMediaType);
                const singleTargetAccount = hasSingleTargetContext
                  ? resolveAccount(
                      payload?.destinations?.[0]
                        ? ({
                            socialMediaId: payload.socialMediaId ?? '',
                            socialMediaType: payload.socialMediaType ?? '',
                            destinationOwnerId: payload.destinations[0].pageId ?? null,
                            status: ''
                          } as BatchTarget)
                        : undefined,
                      payload?.socialMediaId
                    )
                  : undefined;

                return (
                  <li key={n.userNotificationId}>
                    <button
                      type='button'
                      onClick={() => {
                        if (!n.isRead) markOne.mutate(n.userNotificationId);
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5',
                        !n.isRead && 'bg-white/[0.03]'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                          toneClass
                        )}
                      >
                        <Icon className='size-4' />
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start gap-2'>
                          <p className='flex-1 truncate text-xs font-semibold text-white'>
                            {n.title || 'Notification'}
                          </p>
                          {!n.isRead && <span className='mt-1 size-1.5 shrink-0 rounded-full bg-rose-400' />}
                        </div>
                        {n.message && <p className='mt-0.5 line-clamp-2 text-xs text-white/70'>{n.message}</p>}

                        {/* Enriched target detail for social-media related events. Render
                            the chip even when the account lookup fails so the user can still
                            see which platform it was — TargetChip falls back to an initial
                            letter + platform badge. */}
                        {hasSingleTargetContext && (
                          <div className='mt-1.5'>
                            <TargetChip
                              account={singleTargetAccount}
                              platformType={payload?.socialMediaType}
                              status={FAILURE_TYPES.has(n.type) ? 'failed' : 'published'}
                            />
                            {FAILURE_TYPES.has(n.type) && payload?.errorMessage && (
                              <p className='mt-1 line-clamp-2 text-[10px] italic text-rose-300/80'>
                                {payload.errorMessage}
                              </p>
                            )}
                          </div>
                        )}

                        {isBatch && targets.length > 0 && (
                          <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                            {targets.map((target, idx) => (
                              <TargetChip
                                key={`${target.socialMediaId}-${target.destinationOwnerId ?? idx}`}
                                account={resolveAccount(target)}
                                platformType={target.socialMediaType}
                                status={target.status}
                              />
                            ))}
                          </div>
                        )}

                        <p className='mt-1 text-[10px] text-white/40'>{formatRelative(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!isLoading && items.length > 0 && hasMore && (
            <div className='border-t border-white/5 px-3 py-2'>
              <button
                type='button'
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white'
              >
                <ChevronDown className='size-3.5' />
                Load more ({allItems.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
