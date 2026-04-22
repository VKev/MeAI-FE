import { useNavigate, useParams } from 'react-router';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import type { TProfile } from '@/models/profile.model';
import CoinIcon from '@/components/icons/CoinIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useUserStore } from '@/store/user.store';
interface TProps {
  user: TProfile | null;
  isShowSideBar: boolean;
}

export default function WorkspaceHeader({ user, isShowSideBar }: TProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  // Prefer the live balance from the Zustand store so optimistic debits during generation
  // update the header coin badge immediately.
  const liveCoin = useUserStore((s) => s.user?.meAiCoin);
  const coinBalance = liveCoin ?? user?.meAiCoin ?? 0;

  const handleNavigate = () => {
    if (isShowSideBar) {
      navigate('/user');
    } else {
      navigate(`/workspace/${workspaceId}`);
    }
  };

  return (
    <header className='h-16 sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Left: back + brand */}
        <div className='flex items-center gap-4'>
          <button aria-label='Back' onClick={handleNavigate} className='p-2 rounded-md hover:bg-neutral-800/50'>
            <ArrowLeftFromLineIcon className='w-5 h-5 text-white' />
          </button>

          {/* Logo */}
          <div className='shrink-0'>
            <img src='/logo-meai.webp' alt='MeAI' className='h-14 w-auto' />
          </div>
        </div>

        {/* Right: notifications + coins */}
        <div className='flex items-center gap-3'>
          <NotificationBell variant='header' side='bottom' align='end' sideOffset={8} />
          <div
            title='Buy MeAI Coins'
            className='flex items-center justify-center gap-0.5 cursor-pointer px-5 py-1 rounded-xl border border-purple-500 hover:bg-neutral-800/50'
            onClick={() => navigate('/user/plans')}
          >
            {/* icon coin */}
            <CoinIcon />
            <p className='text-sm font-semibold text-white'>{coinBalance}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
