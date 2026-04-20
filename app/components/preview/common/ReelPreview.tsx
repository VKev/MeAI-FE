import MetaVideoMedia from '@/components/preview/common/MetaVideoMedia';
import VideoPreview from '@/components/preview/common/VideoPreview';
import { cn } from '@/lib/utils';
import { ImageIcon, Music2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const COLLAPSED_CAPTION_MAX_HEIGHT = 80;

type ReelPreviewProps = {
  src: string;
  captionHtml: string;
  placeholder: string;
  mediaType?: 'image' | 'video';
};

function ReelPreview({ src, captionHtml, placeholder, mediaType = 'video' }: ReelPreviewProps) {
  const content = captionHtml || placeholder;

  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowSeeMore, setShouldShowSeeMore] = useState(false);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const shouldShowExpandedOverlay = isExpanded && shouldShowSeeMore;

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    const captionNode = captionRef.current;
    if (!captionNode) return;

    const frameId = window.requestAnimationFrame(() => {
      const hasOverflow = captionNode.scrollHeight > COLLAPSED_CAPTION_MAX_HEIGHT + 1;
      setShouldShowSeeMore(hasOverflow);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [content]);

  const overlay = (
    <>
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
            ref={captionRef}
            className={cn(
              'mt-1 text-sm max-w-70 text-white/90 transition-all wrap-break-word prose prose-invert',
              isExpanded ? 'max-h-120 overflow-y-auto' : 'max-h-20 overflow-hidden'
            )}
            dangerouslySetInnerHTML={{
              __html: content
            }}
          />
          {shouldShowSeeMore && (
            <button
              type='button'
              onClick={handleToggleExpanded}
              className='mt-1 text-xs font-medium text-white/75 hover:text-white/95'
            >
              {isExpanded ? 'see less' : 'see more'}
            </button>
          )}
          <div className='mt-3 flex items-center gap-2 text-xs text-white/85'>
            {mediaType === 'image' ? (
              <>
                <ImageIcon className='h-3.5 w-3.5' />
                <span className='truncate'>Photo reel</span>
              </>
            ) : (
              <>
                <Music2 className='h-3.5 w-3.5' />
                <span className='truncate'>Original sound - preview mode</span>
              </>
            )}
          </div>
        </div>

        <MetaVideoMedia />
      </div>
    </>
  );

  if (mediaType === 'image') {
    return (
      <>
        <img
          src={src}
          alt='reel'
          className='absolute inset-0 h-full w-full object-cover'
        />
        <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30' />
        {overlay}
      </>
    );
  }

  return <VideoPreview src={src} mediaLabel='reel'>{overlay}</VideoPreview>;
}

export default ReelPreview;
