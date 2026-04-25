import { cn } from '@/lib/utils';
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

  const initial = username?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center rounded-full', {
        'avatar-silver': level === 'silver',
        'avatar-gold': level === 'gold'
      })}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt='avatar' className='w-full h-full rounded-full object-cover' />
      ) : (
        <div className='w-full h-full rounded-full flex items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 text-white font-bold'>
          {initial}
        </div>
      )}

      {level !== 'normal' && <div className='vip-badge'>👑</div>}
    </div>
  );
}

export default UserAvatar;
