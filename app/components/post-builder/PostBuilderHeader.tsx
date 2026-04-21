import CoinIcon from '@/components/icons/CoinIcon';
import DialogPublishPost from '@/components/preview/common/DialogPublishPost';
import type { TProfile } from '@/models/profile.model';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import usePostBuilder, { type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

interface TProps {
  user?: TProfile | null;
  workspaceId?: string;
  autoOpenPublishDialog?: boolean;
}

// FE uses `thread` (no s); API/DB uses `threads`. Normalize for matching.
function normalizePlatform(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'thread' ? 'threads' : normalized;
}

function PostBuilderHeader({ user, workspaceId, autoOpenPublishDialog = false }: TProps) {
  const navigate = useNavigate();
  const { id: postBuilderId } = useParams();
  const canPublish = usePostBuilder((state) => state.canPublish());
  const platformModes = usePostBuilder((state) => state.platformModes);
  const platformContents = usePostBuilder((state) => state.platformContents);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const isPublishDisabled = !canPublish;
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(autoOpenPublishDialog);

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', postBuilderId],
    queryFn: () => PostBuilderClientApi.getPostBuilder(postBuilderId!),
    enabled: Boolean(postBuilderId)
  });

  const publishPayload = useMemo(() => {
    const platforms: PostBuilderPlatform[] = ['tiktok', 'facebook', 'instagram', 'thread'];
    const builderGroups = postBuilderData?.value?.socialMedia ?? [];

    return platforms.map((platform) => {
      const mode = platformModes[platform];
      const content = platformContents[platform]?.[mode] ?? { text: '', html: '' };
      const resourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];

      // Resolve the existing post-builder child post for this platform+type.
      // Prefer an exact platform+type match; fall back to platform-only.
      const dbPlatform = normalizePlatform(platform);
      const typeMatch = builderGroups.find(
        (group) => normalizePlatform(group.platform) === dbPlatform && (group.type ?? '') === mode
      );
      const platformMatch = typeMatch ?? builderGroups.find((group) => normalizePlatform(group.platform) === dbPlatform);
      const existingPostId = platformMatch?.posts?.[0]?.id ?? null;

      return {
        platform,
        contentHtml: content.html,
        content: content.text,
        resourceIds,
        mode,
        postId: existingPostId
      };
    });
  }, [platformModes, platformContents, previewStates, postBuilderData]);

  const handlePublish = () => {
    setIsPublishDialogOpen(true);
  };

  return (
    <header className='sticky top-0 z-12 w-full bg-zinc-950 border-b border-zinc-900'>
      <div className='max-w-full mx-auto px-6 py-2 flex items-center justify-between'>
        {/* Left: back + brand */}
        <div className='flex items-center gap-4'>
          <button
            aria-label='Back'
            onClick={() => {
              if (workspaceId) {
                navigate(`/workspace/${workspaceId}`);
              } else {
                navigate(-1);
              }
            }}
            className='p-2 rounded-md hover:bg-neutral-800/50'
          >
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
            onClick={handlePublish}
            className='px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:cursor-not-allowed disabled:bg-purple-900/50 disabled:text-white/60 disabled:hover:bg-purple-900/50'
          >
            Publish
          </button>
        </div>
      </div>

      <DialogPublishPost
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        payloads={publishPayload}
        workspaceId={workspaceId}
      />
    </header>
  );
}

export default PostBuilderHeader;
