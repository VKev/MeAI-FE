import CoinIcon from '@/components/icons/CoinIcon';
import { useUserStore } from '@/store/user.store';
import NotificationBell from '@/components/notifications/NotificationBell';
import DialogPublishPost from '@/components/preview/common/DialogPublishPost';
import type { TProfile } from '@/models/profile.model';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import usePostBuilder from '@/routes/post-builder/hooks/usePostBuilder';
import usePostBuilderPublishPayloads from '@/routes/post-builder/hooks/usePostBuilderPublishPayloads';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

interface TProps {
  user?: TProfile | null;
  workspaceId?: string;
}

function PostBuilderHeader({ user, workspaceId }: TProps) {
  const navigate = useNavigate();
  const { id: postBuilderId } = useParams();
  const isCaptionGenerating = usePostBuilder((state) => state.isCaptionGenerating);
  const liveCoin = useUserStore((s) => s.user?.meAiCoin);
  const coinBalance = liveCoin ?? user?.meAiCoin ?? 0;
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', postBuilderId],
    queryFn: () => PostBuilderClientApi.getPostBuilder(postBuilderId!),
    enabled: Boolean(postBuilderId),
    refetchOnMount: 'always'
  });

  const { payloads, canPublish } = usePostBuilderPublishPayloads(postBuilderData?.value);
  const isPublishDisabled = !canPublish || isCaptionGenerating;

  const handlePublish = () => {
    setIsPublishDialogOpen(true);
  };

  return (
    <header className='sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 py-2 flex items-center justify-between'>
        {/* Left: back + brand */}
        <div className='flex items-center gap-4'>
          <button aria-label='Back' onClick={() => navigate(-1)} className='p-2 rounded-2xl hover:bg-neutral-800/50'>
            <ArrowLeftFromLineIcon className='size-6 text-white' />
          </button>

          {/* Logo */}
          <div className='shrink-0' onClick={() => navigate('/user')}>
            <img src='/logo-meai.webp' alt='MeAI' className='h-14 w-auto' />
          </div>
        </div>

        {/* Right: Actions */}
        <div className='flex items-center justify-center gap-4'>
          <NotificationBell variant='header' side='bottom' align='end' sideOffset={8} />
          <div
            className='flex items-center justify-center gap-1 cursor-pointer px-4 py-2 rounded-2xl border border-purple-500 hover:bg-neutral-800/50'
            title='Buy MeAI Coins'
            onClick={() => navigate('/user/plans')}
          >
            {/* icon coin */}
            <CoinIcon />
            <p className='text-md font-semibold text-white'>{coinBalance}</p>
          </div>
          <button
            type='button'
            disabled={isPublishDisabled}
            onClick={handlePublish}
            className='px-4 py-2 rounded-2xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:cursor-not-allowed disabled:bg-purple-900/50 disabled:text-white/60 disabled:hover:bg-purple-900/50'
          >
            Publish
          </button>
        </div>
      </div>

      <DialogPublishPost
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        payloads={payloads}
        workspaceId={workspaceId}
      />
    </header>
  );
}

export default PostBuilderHeader;
