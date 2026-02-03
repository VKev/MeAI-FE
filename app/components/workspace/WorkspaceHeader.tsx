import { useNavigate, useParams } from 'react-router';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import type { TProfile } from '@/models/profile.model';
interface TProps {
  user: TProfile | null;
  isShowSideBar: boolean;
}

export default function WorkspaceHeader({ user, isShowSideBar }: TProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const handleNavigate = () => {
    if (isShowSideBar) {
      navigate('/user');
    } else {
      navigate(`/workspace/${workspaceId}`);
    }
  };

  return (
    <header className='sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Left: back + brand */}
        <div className='flex items-center gap-4'>
          <button aria-label='Back' onClick={handleNavigate} className='p-2 rounded-md hover:bg-neutral-800/50'>
            <ArrowLeftFromLineIcon className='w-5 h-5 text-white' />
          </button>

          {/* Logo */}
          <div className='shrink-0'>
            <img src='/logo-meai.png' alt='MeAI' className='h-10 w-auto' />
          </div>
        </div>

        {/* Right: coins + upgrade */}
        <div
          title='Buy MeAI Coins'
          className='flex items-center justify-center gap-0.5 cursor-pointer px-5 py-1 rounded-xl border border-purple-500 hover:bg-neutral-800/50'
          onClick={() => navigate('/user/plans')}
        >
          {/* icon coin */}
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='text-purple-500 size-5'
          >
            <path
              d='M7 18.6778C7 19.4889 7.24445 20.2222 7.70001 20.8555C4.72223 20.6666 2 19.5778 2 17.5667V16.5889C3.16667 17.5 4.88889 18.1111 7 18.3111V18.6778ZM7.04442 14.1556C7.03331 14.1667 7.03337 14.1777 7.03337 14.1889C7.01114 14.3 7 14.4111 7 14.5222V16.6444C4.31111 16.3333 2 15.2667 2 13.4111V12.4334C3.16667 13.3556 4.90003 13.9667 7.03337 14.1556H7.04442ZM11.3778 10.0889C9.68889 10.6111 8.36667 11.4666 7.63334 12.5333C4.67779 12.3444 2 11.2556 2 9.25559V8.49997C3.45556 9.64442 5.78889 10.3111 8.66667 10.3111C9.63333 10.3111 10.5444 10.2334 11.3778 10.0889ZM15.3333 8.49997V9.25559C15.3333 9.35559 15.3222 9.44448 15.3111 9.53337C14.4333 9.53337 13.6 9.61108 12.8222 9.74441C13.8222 9.44441 14.6667 9.0222 15.3333 8.49997ZM8.66667 2C5.33333 2 2 3.1111 2 5.32221C2 7.55554 5.33333 8.64442 8.66667 8.64442C12 8.64442 15.3333 7.55554 15.3333 5.32221C15.3333 3.1111 12 2 8.66667 2ZM15.3333 19.5111C12.5444 19.5111 10.1667 18.7778 8.66667 17.5889V18.6778C8.66667 20.8889 12 22 15.3333 22C18.6667 22 22 20.8889 22 18.6778V17.5889C20.5 18.7778 18.1222 19.5111 15.3333 19.5111ZM15.3333 11.2C11.6556 11.2 8.66667 12.6889 8.66667 14.5222C8.66667 16.3556 11.6556 17.8445 15.3333 17.8445C19.0111 17.8445 22 16.3556 22 14.5222C22 12.6889 19.0111 11.2 15.3333 11.2Z'
              fill='currentColor'
            ></path>
          </svg>
          <p className='text-sm font-semibold text-white'>{user?.meAiCoin}</p>
        </div>
      </div>
    </header>
  );
}
