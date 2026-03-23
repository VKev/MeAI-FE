import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import {
  ChevronLeft,
  ChevronRight,
  Disc3,
  Heart,
  ImportIcon,
  MessageCircle,
  Music2,
  Play,
  Share2,
  Volume2,
  VolumeX
} from 'lucide-react';
import EmptyVideoPreview from '@/components/preview/Tiktok/EmptyVideoPreview';
import EmptyImagePreview from '@/components/preview/Tiktok/EmptyImagePreview';

type PreviewMode = 'video' | 'image';

function TiktokPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('video');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const visibleGalleryItems = useMemo(() => dataMediaResource, [dataMediaResource]);
  const selectedMediaItems = useMemo(
    () =>
      visibleGalleryItems.filter((item) => {
        if (!selectedMediaIds.includes(item.id)) return false;
        return item.type === previewMode;
      }),
    [visibleGalleryItems, selectedMediaIds, previewMode]
  );

  const activeVideoItem = previewMode === 'video' ? selectedMediaItems[0] : undefined;
  const activeSlideItem = previewMode === 'image' ? selectedMediaItems[currentSlideIndex] : undefined;

  useEffect(() => {
    setSelectedMediaIds((prev) => {
      const allowedIds = new Set(
        visibleGalleryItems.filter((item) => item.type === previewMode).map((item) => item.id)
      );
      const nextSelected = prev.filter((id) => allowedIds.has(id));

      // TikTok video posts only support one selected video in video mode.
      if (previewMode === 'video' && nextSelected.length > 1) {
        return [nextSelected[0]];
      }

      return nextSelected;
    });
  }, [previewMode, visibleGalleryItems]);

  useEffect(() => {
    if (currentSlideIndex > 0 && currentSlideIndex >= selectedMediaItems.length) {
      setCurrentSlideIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentSlideIndex]);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [previewMode]);

  useEffect(() => {
    if (previewMode !== 'video') return;

    // Reset visual playback state when selected video changes.
    setIsVideoPlaying(Boolean(activeVideoItem));
  }, [previewMode, activeVideoItem]);

  const toggleSelection = (item: TMediaResource) => {
    if (item.type !== previewMode) return;

    setSelectedMediaIds((prev) => {
      if (previewMode === 'video') {
        return prev.includes(item.id) ? [] : [item.id];
      }

      return prev.includes(item.id) ? prev.filter((selectedId) => selectedId !== item.id) : [...prev, item.id];
    });
  };

  const nextSlide = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentSlideIndex((prev) => (prev + 1) % selectedMediaItems.length);
  }, [selectedMediaItems.length]);

  const prevSlide = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentSlideIndex((prev) => (prev - 1 + selectedMediaItems.length) % selectedMediaItems.length);
  }, [selectedMediaItems.length]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;

      const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = touchEndX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(delta) < 40) return;

      if (delta < 0) {
        nextSlide();
        return;
      }

      prevSlide();
    },
    [nextSlide, prevSlide]
  );

  const handleVideoPreviewClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }, []);

  const handleToggleMute = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsVideoMuted((prev) => !prev);
  }, []);

  const renderVideoPreview = useCallback(() => {
    if (previewMode !== 'video') return null;

    if (activeVideoItem)
      return (
        <>
          <video
            ref={videoRef}
            src={activeVideoItem.url}
            onClick={handleVideoPreviewClick}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            className='absolute inset-0 h-full w-full object-cover'
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
          />

          <button
            type='button'
            onClick={handleToggleMute}
            className='absolute right-3 top-3 z-30 rounded-full border border-white/35 bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/70'
            aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
            title={isVideoMuted ? 'Unmute' : 'Mute'}
          >
            {isVideoMuted ? <VolumeX className='h-7 w-7' /> : <Volume2 className='h-7 w-7' />}
          </button>

          <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30' />

          {!isVideoPlaying && (
            <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'>
              <div className='rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white'>Paused</div>
            </div>
          )}

          <div className='absolute inset-x-0 bottom-0 z-10 flex items-end px-4 pb-5'>
            <div className='mr-4 flex-1 text-white'>
              <p className='text-sm font-semibold'>@meai.creator</p>
              <p className='mt-1 line-clamp-2 text-sm text-white/90'>
                {activeVideoItem.name || 'TikTok video preview'}
              </p>
              <div className='mt-3 flex items-center gap-2 text-xs text-white/85'>
                <Music2 className='h-3.5 w-3.5' />
                <span className='truncate'>Original sound - preview mode</span>
              </div>
            </div>

            <div className='flex flex-col items-center gap-4 text-white'>
              <button type='button' className='flex flex-col items-center gap-1'>
                <Heart className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>12.4k</span>
              </button>
              <button type='button' className='flex flex-col items-center gap-1'>
                <MessageCircle className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>541</span>
              </button>
              <button type='button' className='flex flex-col items-center gap-1'>
                <Share2 className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>Share</span>
              </button>
              <div className='rounded-full border border-white/40 p-1'>
                <Disc3 className='h-7 w-7 animate-spin animation-duration-[4s]' />
              </div>
            </div>
          </div>
        </>
      );

    return <EmptyVideoPreview />;
  }, [previewMode, activeVideoItem, handleVideoPreviewClick, handleToggleMute, isVideoMuted, isVideoPlaying]);

  const renderImagePreview = useCallback(() => {
    if (previewMode !== 'image') return null;

    if (selectedMediaItems.length) {
      return (
        <>
          <div className='absolute inset-0' onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {activeSlideItem && (
              <img
                src={activeSlideItem.thumbnail_url}
                alt={activeSlideItem.name || 'TikTok image slide'}
                className='h-full w-full object-cover'
              />
            )}
            <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/25' />
          </div>

          {selectedMediaItems.length > 1 && (
            <>
              <button
                type='button'
                onClick={prevSlide}
                className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65'
                aria-label='Previous slide'
              >
                <ChevronLeft className='h-5 w-5' />
              </button>
              <button
                type='button'
                onClick={nextSlide}
                className='absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65'
                aria-label='Next slide'
              >
                <ChevronRight className='h-5 w-5' />
              </button>
            </>
          )}

          <div className='absolute inset-x-0 bottom-0 z-10 flex items-end px-4 pb-5'>
            <div className='mr-4 flex-1 text-white'>
              <p className='text-sm font-semibold'>@meai.creator</p>
              <p className='mt-1 line-clamp-2 text-sm text-white/90'>Tiktok image preview</p>
              <div className='mt-3 flex items-center gap-2 text-xs text-white/85'>
                <Music2 className='h-3.5 w-3.5' />
                <span className='truncate'>Original sound - preview mode</span>
              </div>
              <div className='mt-3 flex items-center gap-1.5'>
                {selectedMediaItems.map((item, index) => (
                  <span
                    key={item.id}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      index === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className='flex flex-col items-center gap-4 text-white'>
              <button type='button' className='flex flex-col items-center gap-1'>
                <Heart className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>12.4k</span>
              </button>
              <button type='button' className='flex flex-col items-center gap-1'>
                <MessageCircle className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>541</span>
              </button>
              <button type='button' className='flex flex-col items-center gap-1'>
                <Share2 className='h-7 w-7 fill-white text-white' />
                <span className='text-[10px]'>Share</span>
              </button>
              <div className='rounded-full border border-white/40 p-1'>
                <Disc3 className='h-7 w-7 animate-spin animation-duration-[4s]' />
              </div>
            </div>
          </div>
        </>
      );
    }

    return <EmptyImagePreview />;
  }, [
    previewMode,
    selectedMediaItems,
    activeSlideItem,
    currentSlideIndex,
    handleTouchStart,
    handleTouchEnd,
    nextSlide,
    prevSlide
  ]);

  return (
    <section className='rounded-2xl border border-white/10 bg-zinc-950 p-4 lg:p-6'>
      <div className='space-y-5'>
        <div>
          <h3 className='text-md font-semibold text-white'>Select Your Media</h3>
        </div>

        {/* media items */}
        <div className='min-h-50 space-y-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
          <button
            type='button'
            className='flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 text-zinc-300 transition-colors hover:border-purple-500 hover:text-white'
          >
            <ImportIcon className='h-5 w-5' />
            <span className='text-sm'>Import from your library</span>
          </button>
          {visibleGalleryItems.map((item) => {
            const isSelected = selectedMediaIds.includes(item.id);
            const isDisabled = item.type !== previewMode;

            return (
              <button
                key={item.id}
                type='button'
                onClick={() => toggleSelection(item)}
                disabled={isDisabled}
                className={cn(
                  'group relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
                  isDisabled && 'cursor-not-allowed border-none opacity-40 grayscale',
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/40 opacity-80'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <img
                  src={item.thumbnail_url}
                  alt={item.name || 'Gallery media item'}
                  className='h-full w-full object-cover'
                />

                {item.type === 'video' && (
                  <span className='absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white'>
                    <Play className='h-3.5 w-3.5 fill-white text-white' />
                  </span>
                )}

                <span className='absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase text-white'>
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>

        <div className='border-t border-white/10 pt-4'>
          <div className='mb-3 text-md font-semibold text-white'>Preview Mode</div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setPreviewMode('video')}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                previewMode === 'video'
                  ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              )}
            >
              Video mode
            </button>

            <button
              type='button'
              onClick={() => setPreviewMode('image')}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                previewMode === 'image'
                  ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              )}
            >
              Image mode
            </button>
          </div>

          <div className='mt-4 flex justify-center'>
            <div className='relative h-180 w-100 overflow-hidden rounded-[30px] border border-white/15 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.65)]'>
              {previewMode === 'video' ? renderVideoPreview() : renderImagePreview()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TiktokPreview;
