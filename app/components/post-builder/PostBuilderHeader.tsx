import CoinIcon from '@/components/icons/CoinIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import DialogPublishPost from '@/components/preview/common/DialogPublishPost';
import type { TProfile } from '@/models/profile.model';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { createPost, updatePost, type CreatePostPayload } from '@/services/client/post.client';
import usePostBuilder, { type PostBuilderMode, type PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftFromLineIcon, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

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
  const platformContents = usePostBuilder((state) => state.platformContents);
  const previewStates = usePostBuilder((state) => state.previewStates);
  const isPublishDisabled = !canPublish;
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(autoOpenPublishDialog);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const queryClient = useQueryClient();

  const { data: postBuilderData } = useQuery({
    queryKey: ['post-builder', postBuilderId],
    queryFn: () => PostBuilderClientApi.getPostBuilder(postBuilderId!),
    enabled: Boolean(postBuilderId),
    refetchOnMount: 'always'
  });

  const publishPayload = useMemo(() => {
    // Per-platform supported modes — keep in sync with usePostBuilder's createInitialPlatformContents.
    // Emit ONE payload entry per (platform, mode) bucket that has content so the user can publish
    // a Facebook post AND a Facebook reel in the same action (and equivalently for Instagram).
    const platformModesMap: Record<PostBuilderPlatform, PostBuilderMode[]> = {
      tiktok: ['video', 'image'],
      facebook: ['post', 'reel'],
      instagram: ['post', 'reel'],
      thread: ['post']
    };
    const builderGroups = postBuilderData?.value?.socialMedia ?? [];

    const entries: Array<{
      platform: PostBuilderPlatform;
      contentHtml: string;
      content: string;
      resourceIds: string[];
      mode: PostBuilderMode;
      postId: string | null;
    }> = [];

    for (const platform of Object.keys(platformModesMap) as PostBuilderPlatform[]) {
      const dbPlatform = normalizePlatform(platform);

      for (const mode of platformModesMap[platform]) {
        const content = platformContents[platform]?.[mode] ?? { text: '', html: '' };
        const resourceIds = previewStates[platform]?.selectedMediaIds?.[mode] ?? [];
        const hasContent = content.text.trim().length > 0 || resourceIds.length > 0;

        // Skip buckets the user never touched — otherwise we'd enqueue empty posts.
        if (!hasContent) continue;

        // Require an EXACT (platform, type) match. Don't fall back to a different-type post
        // on the same platform — a "reel" bucket must never reuse the "post" bucket's DB row,
        // otherwise editing the reel caption would overwrite the post caption (they'd share
        // the same underlying post.Content). When no exact match exists, postId stays null
        // and DialogPublishPost.handleSubmit routes it through createPost so the new mode
        // gets its own DB row attached to the builder.
        // BE types are "posts"/"reels"; FE modes are "post"/"reel"/"video"/"image".
        const dbType = mode === 'reel' || mode === 'video' ? 'reels' : 'posts';
        const typeMatch = builderGroups.find(
          (group) =>
            normalizePlatform(group.platform) === dbPlatform && (group.type ?? '').toLowerCase() === dbType
        );
        const existingPostId = typeMatch?.posts?.[0]?.id ?? null;

        entries.push({
          platform,
          contentHtml: content.html,
          content: content.text,
          resourceIds,
          mode,
          postId: existingPostId
        });
      }
    }

    return entries;
  }, [platformContents, previewStates, postBuilderData]);

  const handlePublish = () => {
    setIsPublishDialogOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!postBuilderId) return;
    // Save every platform+mode bucket that has either a caption OR selected media into its
    // corresponding post-builder child post. Only hit update for buckets that have data —
    // don't wipe captions on platforms the user hasn't touched.
    const saveablePayloads = publishPayload.filter(
      (item) => item.content.trim().length > 0 || item.resourceIds.length > 0
    );

    if (saveablePayloads.length === 0) {
      toast.info('Nothing to save yet — add a caption or pick media first.');
      return;
    }

    setIsSavingDraft(true);
    let okCount = 0;
    const failures: string[] = [];

    await Promise.all(
      saveablePayloads.map(async (item) => {
        try {
          const modePostType = item.mode === 'reel' || item.mode === 'video' ? 'reels' : 'posts';
          if (item.postId) {
            await updatePost(item.postId, {
              content: {
                content: item.content,
                hashtag: null,
                resource_list: item.resourceIds,
                post_type: modePostType
              }
            });
          } else {
            // No (platform, mode) row on BE yet — create one attached to this builder so
            // the new mode persists as its own group on refetch (e.g. adding a reel caption
            // to a builder that only had a posts-typed row).
            const platformForBe = item.platform === 'thread' ? 'threads' : item.platform;
            const createPayload: CreatePostPayload = {
              workspaceId: workspaceId || null,
              socialMediaId: null,
              title: null,
              content: {
                content: item.content,
                hashtag: null,
                resource_list: item.resourceIds,
                post_type: modePostType
              },
              status: 'draft',
              postBuilderId: postBuilderId ?? null,
              platform: platformForBe
            };
            await createPost(createPayload);
          }
          okCount++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Save failed';
          console.error(`[SaveDraft] ${item.platform} failed:`, msg);
          failures.push(item.platform);
        }
      })
    );

    setIsSavingDraft(false);

    if (okCount > 0) {
      void queryClient.invalidateQueries({ queryKey: ['post-builder', postBuilderId] });
    }

    if (failures.length === 0) {
      toast.success('Draft saved.');
    } else if (okCount > 0) {
      toast.warning(`Partial save — ${failures.join(', ')} failed.`);
    } else {
      toast.error('Failed to save draft.');
    }
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
          <NotificationBell variant='header' side='bottom' align='end' sideOffset={8} />
          <div className='flex items-center justify-center gap-1 cursor-pointer px-4 py-2 rounded-md border border-purple-500 hover:bg-neutral-800/50'>
            {/* icon coin */}
            <CoinIcon />
            <p className='text-md font-semibold text-white'>0</p>
          </div>
          <button
            type='button'
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-md border border-purple-600 bg-zinc-950 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {isSavingDraft && <Loader2 className='h-4 w-4 animate-spin' />}
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
