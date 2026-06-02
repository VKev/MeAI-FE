import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PostMedia } from '@/models/post.model';

export type PostMediaSurfaceItem = {
  id: string;
  url: string;
  isVideo: boolean;
  label: string;
  resourceId?: string;
};

type PostMediaSurfaceProps = {
  items: PostMediaSurfaceItem[];
  tone: 'original' | 'improved';
  emptyTitle: string;
  emptyDescription: string;
  addLabel?: string;
  onAddMedia?: () => void;
  onOpenMedia: (item: PostMediaSurfaceItem) => void;
  onRemoveMedia?: (item: PostMediaSurfaceItem) => void;
};

export function isPostMediaVideo(media: PostMedia) {
  const resourceType = media.resourceType?.toLowerCase() ?? '';
  const contentType = media.contentType?.toLowerCase() ?? '';
  return resourceType.includes('video') || contentType.startsWith('video/');
}

export function isLikelyVideoUrl(url: string) {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return /\.(mp4|mov|m4v|webm|ogg)$/.test(path);
}

export function toPostMediaDisplayItems(media: PostMedia[]): PostMediaSurfaceItem[] {
  return media.map((item, index) => ({
    id: item.resourceId,
    url: item.presignedUrl,
    isVideo: isPostMediaVideo(item),
    label: `Media ${index + 1}`,
    resourceId: item.resourceId
  }));
}

export function toGeneratedMediaDisplayItems(
  urls: readonly string[] | null | undefined,
  fallbackUrl: string | null | undefined,
  resourceIds: readonly string[] | null | undefined,
  fallbackId: string
): PostMediaSurfaceItem[] {
  const normalizedUrls = (urls ?? []).filter((url): url is string => Boolean(url?.trim()));
  if (normalizedUrls.length === 0 && fallbackUrl?.trim()) {
    normalizedUrls.push(fallbackUrl.trim());
  }

  return normalizedUrls.map((url, index) => {
    const resourceId = resourceIds?.[index]?.trim() || undefined;
    return {
      id: resourceId ?? `${fallbackId}-${index + 1}`,
      url,
      isVideo: isLikelyVideoUrl(url),
      label: normalizedUrls.length > 1 ? `AI media ${index + 1}` : 'AI media',
      resourceId
    };
  });
}

export default function PostMediaSurface({
  items,
  tone,
  emptyTitle,
  emptyDescription,
  addLabel,
  onAddMedia,
  onOpenMedia,
  onRemoveMedia
}: PostMediaSurfaceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const primaryItem = items[activeIndex] ?? items[0];
  const canAddMedia = Boolean(onAddMedia);
  const isImproved = tone === 'improved';
  const hasMultipleMedia = items.length > 1;

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(Math.max(0, items.length - 1));
    }
  }, [activeIndex, items.length]);

  const goToPrevious = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveIndex((current) => (current + 1) % items.length);
  };

  if (!primaryItem) {
    return (
      <button
        type='button'
        onClick={onAddMedia}
        disabled={!canAddMedia}
        className={cn(
          'flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-8 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2',
          canAddMedia
            ? 'cursor-pointer border-violet-300/25 bg-violet-400/[0.04] hover:border-violet-300/45 hover:bg-violet-400/[0.07] focus-visible:ring-violet-300/40'
            : 'cursor-default border-white/10 bg-black/20 focus-visible:ring-white/20'
        )}
      >
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl border',
            isImproved
              ? 'border-amber-300/15 bg-amber-300/8 text-amber-200'
              : 'border-violet-300/15 bg-violet-300/8 text-violet-200'
          )}
        >
          <ImageIcon className='h-8 w-8' />
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-semibold text-white'>{emptyTitle}</p>
          <p className='max-w-xs text-xs leading-relaxed text-slate-500'>{emptyDescription}</p>
        </div>
        {canAddMedia && addLabel ? (
          <span className='rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-xs font-semibold text-violet-100'>
            <PlusCircle className='mr-1.5 inline h-3.5 w-3.5' />
            {addLabel}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-white/8 bg-[#05070d]'>
      <div className='relative aspect-[4/3] overflow-hidden bg-black/45'>
        {primaryItem.isVideo ? (
          <video src={primaryItem.url} controls playsInline className='h-full w-full object-cover' />
        ) : (
          <button
            type='button'
            onClick={() => onOpenMedia(primaryItem)}
            className='flex h-full w-full cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40'
          >
            <img src={primaryItem.url} alt={primaryItem.label} className='h-full w-full object-cover' />
          </button>
        )}

        <div className='pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3'>
          <span className='rounded-full border border-white/12 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md'>
            {hasMultipleMedia ? `${activeIndex + 1}/${items.length}` : items.length} media
          </span>
          <span className='rounded-full border border-white/12 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md'>
            {primaryItem.isVideo ? 'Video' : 'Image'}
          </span>
        </div>

        {hasMultipleMedia ? (
          <>
            <Button
              type='button'
              size='icon'
              variant='outline'
              aria-label='Previous media'
              onClick={goToPrevious}
              className='absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-white/12 bg-black/60 text-white shadow-lg shadow-black/25 backdrop-blur-md hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-violet-300/40'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              type='button'
              size='icon'
              variant='outline'
              aria-label='Next media'
              onClick={goToNext}
              className='absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-white/12 bg-black/60 text-white shadow-lg shadow-black/25 backdrop-blur-md hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-violet-300/40'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </>
        ) : null}

        {canAddMedia && addLabel ? (
          <Button
            type='button'
            variant='outline'
            onClick={onAddMedia}
            className='absolute bottom-3 right-3 h-9 rounded-xl border-white/12 bg-black/65 px-4 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-violet-300/40'
          >
            <PlusCircle className='mr-2 h-3.5 w-3.5' />
            {addLabel}
          </Button>
        ) : null}

        {onRemoveMedia && primaryItem.resourceId ? (
          <Button
            type='button'
            variant='destructive'
            aria-label={`Remove ${primaryItem.label}`}
            onClick={() => onRemoveMedia(primaryItem)}
            className='absolute bottom-3 left-3 h-9 rounded-xl border border-rose-300/20 bg-rose-500/90 px-4 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur-md hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-300/50'
          >
            <Trash2 className='mr-2 h-3.5 w-3.5' />
            Remove
          </Button>
        ) : null}
      </div>

      <div className='flex gap-3 overflow-x-auto border-t border-white/8 bg-black/20 p-3'>
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={item.id}
              className={cn(
                'group/media relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-black/45 transition-colors',
                isActive ? 'border-violet-300/60 ring-2 ring-violet-300/20' : 'border-white/10'
              )}
            >
              <button
                type='button'
                onClick={() => setActiveIndex(index)}
                className='block h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50'
                aria-label={`Select ${item.label}`}
              >
                {item.isVideo ? (
                  <video src={item.url} muted playsInline preload='metadata' className='h-full w-full object-cover' />
                ) : (
                  <img src={item.url} alt={item.label} loading='lazy' className='h-full w-full object-cover' />
                )}
              </button>
              <span className='pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white/85'>
                {item.isVideo ? 'Video' : 'Image'}
              </span>
              {onRemoveMedia && item.resourceId ? (
                <Button
                  type='button'
                  size='icon'
                  variant='destructive'
                  aria-label={`Remove ${item.label}`}
                  onClick={() => onRemoveMedia(item)}
                  className='absolute bottom-1.5 right-1.5 h-7 w-7 rounded-full bg-rose-500 text-white opacity-100 shadow-md shadow-black/30 hover:bg-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300/50'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              ) : null}
            </div>
          );
        })}
        {canAddMedia && addLabel ? (
          <button
            type='button'
            onClick={onAddMedia}
            className='flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-violet-300/25 bg-violet-400/[0.04] text-[10px] font-semibold text-violet-100 transition-colors duration-200 hover:border-violet-300/45 hover:bg-violet-400/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40'
          >
            <PlusCircle className='h-4 w-4' />
            Add
          </button>
        ) : null}
      </div>
    </div>
  );
}
