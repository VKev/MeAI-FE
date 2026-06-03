import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSocialMediaAvatar, getSocialMediaDisplayName } from '@/utils/social-media-display';
import { PLATFORM_CONFIG, type PlatformType } from '@/routes/user/product-config';
import type { SocialMedia } from '@/models/social-media.model';

interface AccountGroupHeaderProps {
  account: SocialMedia | null | undefined;
  socialMediaType: string | null;
  postCount: number;
}

export default function AccountGroupHeader({ account, socialMediaType, postCount }: AccountGroupHeaderProps) {
  const displayName = getSocialMediaDisplayName(account);
  const avatarUrl = getSocialMediaAvatar(account);
  const platformKey = socialMediaType?.toLowerCase() as PlatformType | undefined;
  const platformConfig = platformKey ? PLATFORM_CONFIG[platformKey] : null;
  const PlatformIcon = platformConfig?.icon;

  return (
    <div className='flex items-center gap-3 pb-3 border-b border-white/8'>
      <Avatar className='h-8 w-8 border border-white/15'>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className='text-[11px] bg-white/5 font-semibold'>
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className='flex items-center gap-2.5 flex-1 min-w-0'>
        <span className='font-semibold text-white/90 text-sm truncate'>
          {displayName}
        </span>
        <span className='text-[11px] text-slate-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/8 shrink-0'>
          {postCount} post{postCount !== 1 ? 's' : ''}
        </span>
      </div>

      {PlatformIcon && (
        <PlatformIcon className='h-5 w-5 shrink-0' color={platformConfig?.color} />
      )}
    </div>
  );
}
