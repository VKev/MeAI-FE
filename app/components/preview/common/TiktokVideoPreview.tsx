import TiktokVideoMedia from '@/components/preview/common/TiktokVideoMedia';
import VideoPreview from '@/components/preview/common/VideoPreview';
import EmptyVideoPreview from '@/components/preview/Tiktok/EmptyVideoPreview';
import { cn } from '@/lib/utils';
import { Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type TiktokVideoPreviewProps = {
  src?: string;
  captionHtml: string;
};

function TiktokVideoPreview({ src, captionHtml }: TiktokVideoPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const shouldShowSeeMore = hasOverflow;
  const shouldShowExpandedOverlay = isExpanded && shouldShowSeeMore;

  useEffect(() => {
    if (isExpanded) return;
    const captionNode = captionRef.current;
    if (!captionNode) return;

    const frameId = window.requestAnimationFrame(() => {
      const overflow = captionNode.scrollHeight > captionNode.clientHeight + 1;
      setHasOverflow(overflow);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [captionHtml, isExpanded]);

  if (!src) {
    return <EmptyVideoPreview />;
  }

  return (
    <VideoPreview src={src} mediaLabel='video'>
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
              __html: captionHtml || 'TikTok video preview'
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
        </div>

        <TiktokVideoMedia />
      </div>
    </VideoPreview>
  );
}

export default TiktokVideoPreview;
