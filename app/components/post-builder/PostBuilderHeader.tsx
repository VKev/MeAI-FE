import CoinIcon from '@/components/icons/CoinIcon';
import type { TProfile } from '@/models/profile.model';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

interface TProps {
  user?: TProfile | null;
}

function PostBuilderHeader({ user }: TProps) {
  const navigate = useNavigate();

  return (
    <header className='h-16 sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Left: back + brand */}
        <div className='flex items-center gap-4'>
          <button aria-label='Back' onClick={() => {}} className='p-2 rounded-md hover:bg-neutral-800/50'>
            <ArrowLeftFromLineIcon className='w-5 h-5 text-white' />
          </button>

          {/* Logo */}
          <div className='shrink-0'>
            <img src='/logo-meai.webp' alt='MeAI' className='h-14 w-auto' />
          </div>
        </div>

        {/* Right: Actions (SaveDraftButton/ PublishButton) */}
        <div className='flex items-center justify-center gap-4'>
          <div className='flex items-center justify-center gap-1 cursor-pointer px-4 py-2 rounded-md border border-purple-500 hover:bg-neutral-800/50'>
            {/* icon coin */}
            <CoinIcon />
            <p className='text-md font-semibold text-white'>0</p>
          </div>
          <button
            type='button'
            className='px-4 py-2 rounded-md border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors'
          >
            Save Draft
          </button>
          <button
            type='button'
            className='px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors'
          >
            Publish
          </button>
        </div>
      </div>
    </header>
  );
}

export default PostBuilderHeader;
