import CoinIcon from '@/components/icons/CoinIcon';
import type { TProfile } from '@/models/profile.model';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

interface TProps {
  user?: TProfile | null;
}

function PostBuilderHeader({ user }: TProps) {
  const navigate = useNavigate();
  const hasHydrated = usePostBuilder((state) => state.hasHydrated);
  const canPublish = usePostBuilder((state) => state.canPublish());
  const isPublishDisabled = !hasHydrated || !canPublish;

  return (
    <header className='sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 py-2 flex items-center justify-between'>
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

        {/* Right: Actions */}
        <div className='flex items-center justify-center gap-4'>
          <div className='flex items-center justify-center gap-1 cursor-pointer px-4 py-2 rounded-md border border-purple-500 hover:bg-neutral-800/50'>
            {/* icon coin */}
            <CoinIcon />
            <p className='text-md font-semibold text-white'>0</p>
          </div>
          <button
            type='button'
            className='px-4 py-2 rounded-md border border-purple-600 bg-zinc-950 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 transition-colors'
          >
            Save Draft
          </button>
          <button
            type='button'
            disabled={isPublishDisabled}
            className='px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:cursor-not-allowed disabled:bg-purple-900/50 disabled:text-white/60 disabled:hover:bg-purple-900/50'
          >
            Publish
          </button>
        </div>
      </div>
    </header>
  );
}

export default PostBuilderHeader;
