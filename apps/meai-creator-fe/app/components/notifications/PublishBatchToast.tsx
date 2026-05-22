import type { SocialMedia } from '@/models/social-media.model';
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  ThreadsIcon
} from '@/components/ui/icons/social-icons';

type BatchTarget = {
  socialMediaId: string;
  socialMediaType: string;
  destinationOwnerId?: string | null;
  status: string;
};

type Props = {
  message: string;
  targets: BatchTarget[];
  accounts: SocialMedia[];
};

const PLATFORM_ICON: Record<string, React.FC<{ size?: number; color?: string; className?: string }>> = {
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

const STATUS_PRIORITY: Record<string, number> = {
  failed: 5,
  rolled_back: 4,
  rolledback: 4,
  draft: 3,
  unpublished: 3,
  published: 2,
  updated: 2,
  completed: 2,
  success: 2
};

function normalizeStatus(status: string | undefined): string {
  return status?.trim().toLowerCase() ?? '';
}

function targetDedupKey(target: BatchTarget): string {
  const socialMediaId = target.socialMediaId?.trim().toLowerCase() || 'unknown';
  const socialMediaType = target.socialMediaType?.trim().toLowerCase() || 'unknown';
  const destinationOwnerId = target.destinationOwnerId?.trim().toLowerCase();
  return destinationOwnerId
    ? `${socialMediaId}|${socialMediaType}|${destinationOwnerId}`
    : `${socialMediaId}|${socialMediaType}`;
}

function chooseVisibleTarget(current: BatchTarget, next: BatchTarget): BatchTarget {
  const currentScore = STATUS_PRIORITY[normalizeStatus(current.status)] ?? 1;
  const nextScore = STATUS_PRIORITY[normalizeStatus(next.status)] ?? 1;
  return nextScore > currentScore ? next : current;
}

function dedupeBatchTargets(targets: BatchTarget[]): BatchTarget[] {
  const byTarget = new Map<string, BatchTarget>();
  for (const target of targets) {
    const key = targetDedupKey(target);
    const current = byTarget.get(key);
    byTarget.set(key, current ? chooseVisibleTarget(current, target) : target);
  }
  return Array.from(byTarget.values());
}

function getAccountDisplay(account: SocialMedia | undefined): { name: string; avatar: string | null } {
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

type ResolvedBatchTarget = {
  target: BatchTarget;
  account: SocialMedia | undefined;
  display: { name: string; avatar: string | null };
};

function resolvedTargetDedupKey(item: ResolvedBatchTarget): string {
  const platform = item.target.socialMediaType?.trim().toLowerCase() || item.account?.type?.trim().toLowerCase() || 'unknown';
  const name = item.display.name.trim().toLowerCase();
  const avatar = item.display.avatar?.trim().toLowerCase() ?? '';
  const externalId =
    item.account?.profile?.pageId?.trim().toLowerCase() ||
    item.account?.profile?.userId?.trim().toLowerCase() ||
    item.account?.profile?.username?.trim().toLowerCase() ||
    '';

  return avatar ? `${platform}|${name}|${avatar}` : `${platform}|${name}|${externalId}`;
}

function chooseVisibleResolvedTarget(current: ResolvedBatchTarget, next: ResolvedBatchTarget): ResolvedBatchTarget {
  const currentScore = STATUS_PRIORITY[normalizeStatus(current.target.status)] ?? 1;
  const nextScore = STATUS_PRIORITY[normalizeStatus(next.target.status)] ?? 1;
  return nextScore > currentScore ? next : current;
}

function dedupeResolvedTargets(targets: ResolvedBatchTarget[]): ResolvedBatchTarget[] {
  const byAccount = new Map<string, ResolvedBatchTarget>();
  for (const target of targets) {
    const key = resolvedTargetDedupKey(target);
    const current = byAccount.get(key);
    byAccount.set(key, current ? chooseVisibleResolvedTarget(current, target) : target);
  }
  return Array.from(byAccount.values());
}

export default function PublishBatchToast({ message, targets, accounts }: Props) {
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const accountsByPageId = new Map(
    accounts
      .map((account) => [account.profile?.pageId?.trim(), account] as const)
      .filter((entry): entry is readonly [string, SocialMedia] => Boolean(entry[0]))
  );
  const visibleTargets = dedupeBatchTargets(targets);

  function resolveAccount(target: BatchTarget): SocialMedia | undefined {
    const destinationId = target.destinationOwnerId?.trim();
    if (destinationId) {
      const byPage = accountsByPageId.get(destinationId);
      if (byPage) return byPage;
    }
    return accountsById.get(target.socialMediaId);
  }

  const resolvedTargets = dedupeResolvedTargets(
    visibleTargets.map((target) => {
      const account = resolveAccount(target);
      return { target, account, display: getAccountDisplay(account) };
    })
  );

  return (
    <div className='flex flex-col gap-2'>
      {message ? <span className='text-xs text-zinc-300'>{message}</span> : null}
      {resolvedTargets.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          {resolvedTargets.map(({ target, account, display }) => {
            const key = resolvedTargetDedupKey({ target, account, display });
            const type = target.socialMediaType?.toLowerCase();
            const PlatformIcon = PLATFORM_ICON[type];
            const platformBg = PLATFORM_BG[type] ?? 'bg-zinc-700';
            const status = normalizeStatus(target.status);
            const statusRing =
              status === 'published' || status === 'updated' || status === 'completed' || status === 'success'
                ? 'ring-emerald-400/60'
                : status === 'draft' || status === 'unpublished'
                  ? 'ring-zinc-400/60'
                  : 'ring-red-400/60';

            return (
              <div
                key={key}
                className='flex items-center gap-2 rounded-md border border-zinc-700/80 bg-zinc-900/70 px-2 py-1'
                title={`${display.name} — ${target.status}`}
              >
                <div className='relative'>
                  {display.avatar ? (
                    <img
                      src={display.avatar}
                      alt=''
                      className={`size-7 rounded-full object-cover ring-2 ${statusRing}`}
                    />
                  ) : (
                    <div className={`flex size-7 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-300 ring-2 ${statusRing}`}>
                      {display.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {PlatformIcon && (
                    <span
                      className={`absolute -left-1 -top-1 flex size-3.5 items-center justify-center rounded-full ${platformBg} ring-1 ring-zinc-950`}
                    >
                      <PlatformIcon size={8} color='white' />
                    </span>
                  )}
                </div>
                <span className='max-w-32 truncate text-xs text-zinc-200'>{display.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
