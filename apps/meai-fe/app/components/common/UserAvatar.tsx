import { cn } from '@/lib/utils';
import { Crown, Sparkles } from 'lucide-react';
import './user-avatar.css';

interface UserAvatarProps {
  userCoin: number | string;
  avatarUrl?: string | null;
  username?: string | null;
  size?: number; // px (optional)
}

const getVipLevel = (coin: number) => {
  if (coin >= 15000) return 'gold';
  if (coin > 0) return 'silver';
  return 'normal';
};

function UserAvatar({ userCoin, avatarUrl, username, size = 28 }: UserAvatarProps) {
  const coin = Number(userCoin) || 0;
  const level = getVipLevel(coin);

  const initial = username?.trim().charAt(0)?.toUpperCase() || '?';
  const hasVipFrame = level !== 'normal';

  return (
    <div
      data-level={level}
      className={cn('user-avatar relative inline-flex items-center justify-center rounded-full', {
        'user-avatar--silver': level === 'silver',
        'user-avatar--gold': level === 'gold'
      })}
      style={{ width: size, height: size }}
    >
      <span className='user-avatar__halo' aria-hidden='true' />
      <span className='user-avatar__ring' aria-hidden='true' />
      <span className='user-avatar__glint' aria-hidden='true' />

      <span className='user-avatar__frame'>
        {avatarUrl ? (
          <img src={avatarUrl} alt={username ? `${username} avatar` : 'User avatar'} className='user-avatar__image' />
        ) : (
          <span className='user-avatar__fallback'>{initial}</span>
        )}
      </span>

      {hasVipFrame && (
        <span
          className={cn('user-avatar__badge', {
            'user-avatar__badge--gold': level === 'gold',
            'user-avatar__badge--silver': level === 'silver'
          })}
          aria-hidden='true'
        >
          {level === 'gold' ? (
            <Crown className='size-3.5' strokeWidth={2.2} />
          ) : (
            <Sparkles className='size-3.5' strokeWidth={2.2} />
          )}
        </span>
      )}
    </div>
  );
}

export default UserAvatar;
