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

export default function PublishBatchToast({ message, targets, accounts }: Props) {
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  return (
    <div className='flex flex-col gap-2'>
      {message ? <span className='text-xs text-zinc-300'>{message}</span> : null}
      {targets.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          {targets.map((target, idx) => {
            const key = `${target.socialMediaId}-${idx}`;
            const account = accountsById.get(target.socialMediaId);
            const display = getAccountDisplay(account);
            const type = target.socialMediaType?.toLowerCase();
            const PlatformIcon = PLATFORM_ICON[type];
            const platformBg = PLATFORM_BG[type] ?? 'bg-zinc-700';
            const statusRing =
              target.status === 'published'
                ? 'ring-emerald-400/60'
                : target.status === 'draft'
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
