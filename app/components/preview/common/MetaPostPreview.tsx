import { Globe, MoreHorizontal, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { TMediaResource } from '@/store/media-resource.store';

const CONTENT_WRAPPER_BY_PLATFORM: Record<'facebook' | 'instagram' | 'thread', string> = {
  facebook: 'border-b border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200',
  instagram: 'border-t border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200',
  thread: 'border-b border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200'
};

const PLACEHOLDER_BY_PLATFORM: Record<'facebook' | 'instagram' | 'thread', string> = {
  facebook: 'Facebook post preview',
  instagram: 'Instagram post preview',
  thread: 'Thread post preview'
};

const MEDIA_LABEL_BY_PLATFORM: Record<'facebook' | 'instagram' | 'thread', string> = {
  facebook: 'Facebook post media',
  instagram: 'Instagram post media',
  thread: 'Threads post media'
};

type MetaPostPreviewProps = {
  platform: 'facebook' | 'instagram' | 'thread';
  captionHtml: string;
  media?: ReactNode;
  mediaItems?: TMediaResource[];
  emptyState?: ReactNode;
  onOpenMedia?: (index: number) => void;
  captionRef?: (node: HTMLDivElement | null) => void;
  authorName?: string;
  authorAvatarUrl?: string | null;
  timestampLabel?: string;
};

function MetaPostPreview({
  platform,
  captionHtml,
  media,
  mediaItems,
  emptyState,
  onOpenMedia,
  captionRef,
  authorName = 'MeAI Creator',
  authorAvatarUrl = null,
  timestampLabel = 'Just now'
}: MetaPostPreviewProps) {
  const content = captionHtml || PLACEHOLDER_BY_PLATFORM[platform];
  const resolvedMediaItems = mediaItems ?? [];
  const mediaLabel = MEDIA_LABEL_BY_PLATFORM[platform];
  const hasMediaItems = resolvedMediaItems.length > 0;
  const authorInitials =
    authorName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MA';
  const contentBlock = (
    <div className={CONTENT_WRAPPER_BY_PLATFORM[platform]}>
      <div
        ref={captionRef ?? undefined}
        className='text-sm max-w-full text-white/90 leading-relaxed wrap-break-word prose prose-invert'
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );

  const renderMediaGrid = () => {
    if (!hasMediaItems) {
      return emptyState ?? null;
    }

    const visibleItems = resolvedMediaItems.slice(0, 4);
    const restCount = Math.max(resolvedMediaItems.length - 4, 0);
    const isSingle = visibleItems.length === 1;

    // Meta platforms display single-item posts at the media's native aspect ratio
    // (Instagram caps at 4:5 portrait / 1.91:1 landscape, Facebook/Threads similar).
    // Force-cropping to 16:9 or 1:1 misrepresents the final post — use object-contain
    // with a max-height and let the media's natural ratio drive the height.
    const singleTileClass =
      'group relative w-full overflow-hidden bg-black flex items-center justify-center max-h-[600px]';
    const singleImgClass =
      'max-h-[600px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]';

    const gridClass = (() => {
      if (visibleItems.length === 2) return 'grid-cols-2';
      if (visibleItems.length === 3) return 'grid-cols-3';
      return 'grid-cols-2';
    })();

    return (
      <div className='overflow-hidden rounded-2xl bg-black'>
        <div className={cn('grid gap-1', isSingle ? 'grid-cols-1' : gridClass)}>
          {visibleItems.map((item, index) => {
            const isVideo = item.type === 'video';
            const mediaSrc = item.thumbnail_url || item.url;
            const isOverflowTile = restCount > 0 && index === 3;

            const tileClassName = isSingle
              ? singleTileClass
              : cn('group relative overflow-hidden bg-zinc-900 aspect-square');
            const imgClassName = isSingle
              ? singleImgClass
              : 'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]';

            const tileContent = (
              <>
                {isVideo && mediaSrc ? (
                  // Videos can't render via <img> — the resource URL is an .mp4 payload.
                  // Use a muted/looping <video> element so the tile shows the first frame
                  // as a natural poster; the Play overlay below makes it obvious it's video.
                  <video
                    src={mediaSrc}
                    muted
                    playsInline
                    preload='metadata'
                    className={imgClassName}
                  />
                ) : mediaSrc ? (
                  <img src={mediaSrc} alt={item.name || mediaLabel} className={imgClassName} />
                ) : null}

                {isVideo && (
                  <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10'>
                    <div className='rounded-full bg-black/55 p-2 text-white opacity-80 transition-opacity group-hover:opacity-100'>
                      <Play className='h-4 w-4 fill-white text-white' />
                    </div>
                  </div>
                )}

                {isOverflowTile && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white'>
                    +{restCount}
                  </div>
                )}
              </>
            );

            if (onOpenMedia) {
              return (
                <button key={item.id} type='button' onClick={() => onOpenMedia(index)} className={tileClassName}>
                  {tileContent}
                </button>
              );
            }

            return (
              <div key={item.id} className={tileClassName}>
                {tileContent}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const mediaBlock = <div className='p-1'>{media ?? renderMediaGrid()}</div>;
  const isInstagram = platform === 'instagram';

  return (
    <article className='overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950'>
      <div className='border-b border-zinc-800 p-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt='' className='h-10 w-10 rounded-full object-cover' />
            ) : (
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white'>
                {authorInitials}
              </div>
            )}
            <div>
              <div className='text-sm font-semibold text-white'>{authorName}</div>
              <div className='flex items-center gap-1 text-xs text-zinc-400'>
                <span>{timestampLabel}</span>
                <span>&middot;</span>
                <Globe className='h-3.5 w-3.5' />
              </div>
            </div>
          </div>

          <button
            type='button'
            className='rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white'
            aria-label='Open post options'
          >
            <MoreHorizontal className='h-4 w-4' />
          </button>
        </div>
      </div>

      {isInstagram ? (
        <>
          {mediaBlock}
          {contentBlock}
        </>
      ) : (
        <>
          {contentBlock}
          {mediaBlock}
        </>
      )}
    </article>
  );
}

export default MetaPostPreview;
