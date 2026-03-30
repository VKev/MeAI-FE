import TiktokVideoMedia from '@/components/preview/common/TiktokVideoMedia';
import EmptyImagePreview from '@/components/preview/Tiktok/EmptyImagePreview';
import { cn } from '@/lib/utils';
import type { TMediaResource } from '@/store/media-resource.store';
import type { TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, Music2 } from 'lucide-react';

type TiktokImagePreviewProps = {
  items: TMediaResource[];
  activeItem?: TMediaResource;
  currentIndex: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  captionHtml: string;
  isExpanded: boolean;
  shouldShowSeeMore: boolean;
  shouldShowExpandedOverlay: boolean;
  onToggleExpanded: () => void;
  captionRef?: (node: HTMLDivElement | null) => void;
};

function TiktokImagePreview({
  items,
  activeItem,
  currentIndex,
  onNextSlide,
  onPrevSlide,
  onTouchStart,
  onTouchEnd,
  captionHtml,
  isExpanded,
  shouldShowSeeMore,
  shouldShowExpandedOverlay,
  onToggleExpanded,
  captionRef
}: TiktokImagePreviewProps) {
  if (!items.length) {
    return <EmptyImagePreview />;
  }

  return (
    <>
      <div className='absolute inset-0' onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {activeItem && (
          <img
            src={activeItem.thumbnail_url}
            alt={activeItem.name || 'TikTok image slide'}
            className='h-full w-full object-cover'
          />
        )}
        <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/25' />
      </div>

      {items.length > 1 && (
        <>
          <button
            type='button'
            onClick={onPrevSlide}
            className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65'
            aria-label='Previous slide'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
          <button
            type='button'
            onClick={onNextSlide}
            className='absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65'
            aria-label='Next slide'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </>
      )}

      {shouldShowExpandedOverlay && <div className='pointer-events-none absolute inset-0 z-25 bg-black/65' />}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-end px-4 pb-5',
          shouldShowExpandedOverlay ? 'z-30' : 'z-10'
        )}
      >
        <div className={cn('mr-4 flex-1 text-white')}>
          <p className='text-sm font-semibold'>@meai.creator</p>
          <div
            ref={captionRef ?? undefined}
            className={cn(
              'mt-1 text-sm max-w-70 text-white/90 transition-all wrap-break-word prose prose-invert',
              isExpanded ? 'max-h-120 overflow-y-auto' : 'max-h-20 overflow-hidden'
            )}
            dangerouslySetInnerHTML={{
              __html: captionHtml || 'TikTok image preview'
            }}
          />
          {shouldShowSeeMore && (
            <button
              type='button'
              onClick={onToggleExpanded}
              className='mt-1 text-xs font-medium text-white/75 hover:text-white/95'
            >
              {isExpanded ? 'see less' : 'see more'}
            </button>
          )}
          <div className='mt-3 flex items-center gap-2 text-xs text-white/85'>
            <Music2 className='h-3.5 w-3.5' />
            <span className='truncate'>Original sound - preview mode</span>
          </div>
          <div className='mt-3 flex items-center gap-1.5'>
            {items.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'
                )}
              />
            ))}
          </div>
        </div>

        <TiktokVideoMedia />
      </div>
    </>
  );
}

export default TiktokImagePreview;
