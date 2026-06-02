import { ImagePlusIcon, Loader2Icon, FolderOpenIcon, CheckIcon, PlayIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem } from './media-types';
import { useEffect, useRef } from 'react';

interface MediaGalleryProps {
  items: MediaItem[];
  selectedItems: MediaItem[];
  draftSelections: MediaItem[];
  canSelectMore: boolean;
  onSelectItem: (item: MediaItem) => void;
  onUploadClick: () => void;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  isUploading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  showUploadButton?: boolean;
}

export default function MediaGallery({
  items,
  selectedItems,
  draftSelections,
  canSelectMore,
  onSelectItem,
  onUploadClick,
  isLoading,
  isFetchingNextPage,
  isUploading,
  hasMore,
  onLoadMore,
  showUploadButton = true
}: MediaGalleryProps) {
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isEmpty = items.length === 0 && !isLoading && !isUploading;

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMore || !onLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNextPage, onLoadMore]);

  return (
    <div className='flex flex-col gap-4'>
      {isEmpty && (
        <div className='flex flex-col items-center justify-center py-16 text-zinc-500'>
          <FolderOpenIcon className='h-10 w-10 mb-3 text-zinc-600' />
          <p className='text-sm font-medium'>No resources yet</p>
          <p className='text-xs mt-1'>Upload or generate images to see them here</p>
        </div>
      )}

      <div className='flex flex-wrap gap-4'>
        {/* Upload button */}
        {showUploadButton && (
          <button
            type='button'
            onClick={onUploadClick}
            disabled={isUploading}
            className={cn(
              'flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-zinc-900/70 transition-colors',
              isUploading
                ? 'border-purple-500/50 text-purple-400 cursor-wait'
                : 'border-zinc-700 text-zinc-300 hover:border-purple-500 hover:text-white'
            )}
          >
            {isUploading ? (
              <>
                <Loader2Icon className='h-5 w-5 animate-spin' />
                <span className='text-sm'>Uploading...</span>
              </>
            ) : (
              <>
                <ImagePlusIcon className='h-5 w-5' />
                <span className='text-sm'>Upload Images</span>
              </>
            )}
          </button>
        )}

        {items.map((item) => {
          const isConfirmed = selectedItems.some((s) => s.id === item.id);
          const isDraft = draftSelections.some((d) => d.id === item.id);
          const isSelected = isConfirmed || isDraft;
          const isDisabled = isConfirmed || (!isDraft && !canSelectMore);

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => onSelectItem(item)}
              disabled={isConfirmed}
              className={cn(
                'relative h-45 w-45 shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all',
                isConfirmed && 'cursor-not-allowed opacity-40 grayscale border-none',
                isDraft && 'border-purple-500 ring-2 ring-purple-500/40',
                !isSelected && !isDisabled && 'border-zinc-700 hover:border-zinc-500',
                !isSelected && isDisabled && 'border-zinc-700 opacity-50 cursor-not-allowed'
              )}
            >
              {item.isVideo ? (
                <>
                  <video src={item.url} muted className='h-full w-full object-cover' />
                  <div className='absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60'>
                    <PlayIcon className='h-3 w-3 text-white fill-white' />
                  </div>
                </>
              ) : (
                <img src={item.url} alt='Gallery media item' className='h-full w-full object-cover' />
              )}
              <span className='absolute left-2 top-2 z-10 rounded-full border border-white/12 bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85 backdrop-blur-md'>
                {item.isVideo ? 'Video' : 'Image'}
              </span>
              {isDraft && (
                <div className='absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 shadow-lg'>
                  <CheckIcon className='h-3.5 w-3.5 text-white' />
                </div>
              )}
              {isConfirmed && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                  <span className='rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300'>
                    Added
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-8'>
          <Loader2Icon className='h-5 w-5 animate-spin text-purple-400' />
          <span className='ml-2 text-sm text-zinc-400'>Loading resources...</span>
        </div>
      )}

      {!isLoading && hasMore && items.length > 0 && (
        <div ref={loadMoreTriggerRef} className='flex justify-center'>
          <button
            type='button'
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className='rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-2 text-sm text-zinc-300 transition-colors hover:border-purple-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isFetchingNextPage ? (
              <>
                <Loader2Icon className='inline h-4 w-4 animate-spin mr-2' />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
