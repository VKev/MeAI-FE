import { useMemo, useState, type ComponentType } from 'react';
import type { SocialMedia } from '@/models/social-media.model';
import type { PostBuilderMode, PostBuilderPlatform } from '@/routes/post-builder/hooks/usePostBuilder';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEDIA_PREVIEW_LIMIT = 4;

type TargetPreview = {
  platform: PostBuilderPlatform;
  mode: PostBuilderMode;
  accounts: SocialMedia[];
  content: string;
  resourceIds: string[];
};

type DialogPublishPreviewProps = {
  targets: TargetPreview[];
};

type AccountDisplay = {
  name: string;
  avatar: string | null;
};

function getAccountDisplay(account: SocialMedia): AccountDisplay {
  const profile = account.profile;
  const type = account.type?.toLowerCase();
  if (!profile) return { name: account.type || 'Account', avatar: null };
  if (type === 'facebook') {
    return {
      name: profile.pageName || profile.displayName || 'Facebook Page',
      avatar: profile.pageProfilePictureUrl || profile.profilePictureUrl || null
    };
  }
  return {
    name: profile.displayName || profile.username || account.type || 'Account',
    avatar: profile.profilePictureUrl || null
  };
}

const PLATFORM_ICON: Record<
  PostBuilderPlatform,
  ComponentType<{ size?: number; color?: string; className?: string }>
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  threads: ThreadsIcon
};

const PLATFORM_BADGE_CLASS: Record<PostBuilderPlatform, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-pink-500 to-amber-500',
  tiktok: 'bg-black',
  threads: 'bg-black'
};

const PLATFORM_LABEL: Record<PostBuilderPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  threads: 'Threads'
};

const MODE_LABEL: Record<PostBuilderMode, string> = {
  post: 'Post',
  reel: 'Reel',
  video: 'Video',
  image: 'Image'
};

function getSelectedMedia(target: TargetPreview, mediaById: Map<string, TMediaResource>): TMediaResource[] {
  return target.resourceIds.map((id) => mediaById.get(id)).filter((m): m is TMediaResource => Boolean(m));
}

export default function DialogPublishPreview({ targets }: DialogPublishPreviewProps) {
  const mediaResources = useMediaResourceStore((state) => state.mediaResources);
  const mediaById = useMemo(() => new Map(mediaResources.map((m) => [m.id, m])), [mediaResources]);

  // Lightbox state — which target's media is open, and at what index.
  const [lightboxTargetKey, setLightboxTargetKey] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxItems = useMemo<TMediaResource[]>(() => {
    if (!lightboxTargetKey) return [];
    const target = targets.find((t) => `${t.platform}-${t.mode}` === lightboxTargetKey);
    if (!target) return [];
    return getSelectedMedia(target, mediaById);
  }, [lightboxTargetKey, targets, mediaById]);

  if (targets.length === 0) {
    return (
      <div className='flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 px-4 text-center text-zinc-400'>
        <p className='text-sm font-medium text-white'>Nothing to review yet</p>
        <p className='mt-1 text-xs'>Select at least one account to review what will be posted.</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {targets.map((target) => {
        const targetKey = `${target.platform}-${target.mode}`;
        const selectedMedia = getSelectedMedia(target, mediaById);
        const PlatformIcon = PLATFORM_ICON[target.platform];
        const captionText = target.content.trim();
        const accountDisplays = target.accounts.map(getAccountDisplay);

        return (
          <section key={targetKey} className='w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/35'>
            <header className='flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2'>
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md',
                  PLATFORM_BADGE_CLASS[target.platform]
                )}
              >
                <PlatformIcon size={14} color='white' />
              </div>
              <p className='text-sm font-semibold text-white'>{PLATFORM_LABEL[target.platform]}</p>
              <span className='rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400'>
                {MODE_LABEL[target.mode]}
              </span>
            </header>

            <div className='space-y-2.5 p-3'>
              <div className='flex flex-wrap gap-1.5'>
                {accountDisplays.map((account, idx) => (
                  <span
                    key={`${targetKey}-acc-${idx}`}
                    className='inline-flex max-w-36 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-1.5 py-0.5'
                    title={account.name}
                  >
                    {account.avatar ? (
                      <img src={account.avatar} alt='' className='size-4 rounded-full object-cover' />
                    ) : (
                      <span className='flex size-4 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-semibold text-zinc-200'>
                        {account.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className='truncate text-[11px] text-zinc-200'>{account.name}</span>
                  </span>
                ))}
              </div>

              <div className='whitespace-pre-wrap wrap-break-word rounded-md bg-zinc-950/60 px-3 py-2 text-sm leading-relaxed text-zinc-200'>
                {captionText ? captionText : <span className='italic text-zinc-500'>No caption</span>}
              </div>

              {selectedMedia.length > 0
                ? (() => {
                    const visibleCount = Math.min(selectedMedia.length, MEDIA_PREVIEW_LIMIT);
                    const colsClass =
                      visibleCount === 1
                        ? 'grid-cols-1'
                        : visibleCount === 2
                          ? 'grid-cols-2'
                          : visibleCount === 3
                            ? 'grid-cols-3'
                            : 'grid-cols-4';
                    return (
                      <div className={cn('grid gap-2', colsClass)}>
                        {selectedMedia.slice(0, MEDIA_PREVIEW_LIMIT).map((media, idx) => {
                          const isLastVisible = idx === MEDIA_PREVIEW_LIMIT - 1;
                          const overflowCount = selectedMedia.length - MEDIA_PREVIEW_LIMIT;
                          const showOverflow = isLastVisible && overflowCount > 0;
                          return (
                            <button
                              key={media.id}
                              type='button'
                              onClick={() => {
                                setLightboxTargetKey(targetKey);
                                setLightboxIndex(idx);
                              }}
                              className='relative aspect-square w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 transition hover:border-purple-500/60'
                            >
                              {media.type === 'video' ? (
                                <>
                                  <video
                                    src={media.url}
                                    muted
                                    playsInline
                                    className='absolute inset-0 h-full w-full object-cover'
                                  />
                                  <span className='absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white'>
                                    <Play className='h-3 w-3 fill-white text-white' />
                                  </span>
                                </>
                              ) : (
                                <img
                                  src={media.thumbnail_url}
                                  alt=''
                                  className='absolute inset-0 h-full w-full object-cover'
                                />
                              )}
                              {showOverflow ? (
                                <span className='absolute inset-0 flex items-center justify-center bg-black/65 text-xl font-semibold text-white'>
                                  +{overflowCount}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                : null}
            </div>
          </section>
        );
      })}

      <DialogViewMedia
        isOpen={lightboxTargetKey !== null}
        items={lightboxItems}
        activeIndex={lightboxIndex}
        setActiveIndex={(next) =>
          setLightboxIndex((prev) => {
            const resolved = typeof next === 'function' ? next(prev) : next;
            return Math.max(0, Math.min(resolved, Math.max(lightboxItems.length - 1, 0)));
          })
        }
        onClose={() => setLightboxTargetKey(null)}
        label='Post media'
      />
    </div>
  );
}

export type { TargetPreview };
