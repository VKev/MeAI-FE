import TiktokVideoMedia from '@/components/preview/common/TiktokVideoMedia';
import EmptyImagePreview from '@/components/preview/Tiktok/EmptyImagePreview';
import { cn } from '@/lib/utils';
import type { TMediaResource } from '@/store/media-resource.store';
import { ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

const COLLAPSED_CAPTION_MAX_HEIGHT = 80;

type IndexUpdater = number | ((prev: number) => number);

type TiktokImagePreviewProps = {
  items: TMediaResource[];
  activeItem?: TMediaResource;
  currentIndex: number;
  onChangeIndex: (nextIndex: IndexUpdater) => void;
  captionHtml: string;
  authorName?: string;
};

function TiktokImagePreview({
  items,
  activeItem,
  currentIndex,
  onChangeIndex,
  captionHtml,
  authorName = '@meai.creator'
}: TiktokImagePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const shouldShowSeeMore = hasOverflow;
  const shouldShowExpandedOverlay = isExpanded && shouldShowSeeMore;

  useEffect(() => {
    const captionNode = captionRef.current;
    if (!captionNode) return;

    const frameId = window.requestAnimationFrame(() => {
      const overflow = captionNode.scrollHeight > COLLAPSED_CAPTION_MAX_HEIGHT + 1;
      setHasOverflow(overflow);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [captionHtml]);

  const handleNextSlide = () => {
    if (!items.length) return;
    onChangeIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrevSlide = () => {
    if (!items.length) return;
    onChangeIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchEndX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) return;

    if (delta < 0) {
      handleNextSlide();
      return;
    }

    handlePrevSlide();
  };

  if (!items.length) {
    return <EmptyImagePreview />;
  }

  return (
    <>
      <div className='absolute inset-0' onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
            onClick={handlePrevSlide}
            className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65'
            aria-label='Previous slide'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
          <button
            type='button'
            onClick={handleNextSlide}
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
          <p className='text-sm font-semibold'>{authorName}</p>
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
              onClick={() => setIsExpanded((prev) => !prev)}
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
