import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import TiktokImagePreview from '@/components/preview/common/TiktokImagePreview';
import TiktokVideoPreview from '@/components/preview/common/TiktokVideoPreview';
import { ImportIcon, Play } from 'lucide-react';
import InlineAlert from '@/components/preview/common/InlineAlert';

type PreviewMode = 'video' | 'image';

function TiktokPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    setMode: setPreviewMode,
    setSelectedMediaIds,
    setCurrentMediaIndex
  } = usePlatformPreviewState('tiktok');
  const previewMode = mode as PreviewMode;
  const [expandedByMode, setExpandedByMode] = useState<Record<PreviewMode, boolean>>({
    video: false,
    image: false
  });
  const isExpanded = expandedByMode[previewMode];
  const currentSlideIndex = currentMediaIndex;
  const [overflowByMode, setOverflowByMode] = useState<Record<PreviewMode, boolean>>({ video: false, image: false });
  const touchStartX = useRef<number | null>(null);
  const captionRefs = useRef<Record<PreviewMode, HTMLDivElement | null>>({ video: null, image: null });

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
  const previewContext = useMemo(() => ({ platform: 'tiktok' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );
  const shouldShowSeeMore = overflowByMode[previewMode];
  const shouldShowExpandedOverlay = isExpanded && shouldShowSeeMore;

  const setCaptionRef = useCallback(
    (mode: PreviewMode) => (node: HTMLDivElement | null) => {
      captionRefs.current[mode] = node;
    },
    []
  );

  useEffect(() => {
    if (isExpanded) return;
    const captionNode = captionRefs.current[previewMode];
    if (!captionNode) return;

    const frameId = window.requestAnimationFrame(() => {
      const hasOverflow = captionNode.scrollHeight > captionNode.clientHeight + 1;
      setOverflowByMode((prev) => ({ ...prev, [previewMode]: hasOverflow }));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [previewMode, isExpanded, content]);

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
  }, [previewMode, setSelectedMediaIds, visibleGalleryItems]);

  useEffect(() => {
    if (currentSlideIndex > 0 && currentSlideIndex >= selectedMediaItems.length) {
      setCurrentMediaIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentSlideIndex, setCurrentMediaIndex]);

  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [previewMode, setCurrentMediaIndex]);

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
    setCurrentMediaIndex((prev) => (prev + 1) % selectedMediaItems.length);
  }, [selectedMediaItems.length, setCurrentMediaIndex]);

  const prevSlide = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentMediaIndex((prev) => (prev - 1 + selectedMediaItems.length) % selectedMediaItems.length);
  }, [selectedMediaItems.length, setCurrentMediaIndex]);

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

  const handleToggleExpanded = useCallback(() => {
    setExpandedByMode((prev) => ({
      ...prev,
      [previewMode]: !prev[previewMode]
    }));
  }, [previewMode]);

  const renderVideoPreview = useCallback(() => {
    if (previewMode !== 'video') return null;

    return (
      <TiktokVideoPreview
        src={activeVideoItem?.url}
        captionHtml={previewContentState.previewText}
        isExpanded={isExpanded}
        shouldShowSeeMore={shouldShowSeeMore}
        shouldShowExpandedOverlay={shouldShowExpandedOverlay}
        onToggleExpanded={handleToggleExpanded}
        captionRef={setCaptionRef('video')}
      />
    );
  }, [
    previewMode,
    activeVideoItem,
    handleToggleExpanded,
    previewContentState,
    setCaptionRef,
    isExpanded,
    shouldShowSeeMore,
    shouldShowExpandedOverlay
  ]);

  const renderImagePreview = useCallback(() => {
    if (previewMode !== 'image') return null;

    return (
      <TiktokImagePreview
        items={selectedMediaItems}
        activeItem={activeSlideItem}
        currentIndex={currentSlideIndex}
        onNextSlide={nextSlide}
        onPrevSlide={prevSlide}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        captionHtml={previewContentState.previewText}
        isExpanded={isExpanded}
        shouldShowSeeMore={shouldShowSeeMore}
        shouldShowExpandedOverlay={shouldShowExpandedOverlay}
        onToggleExpanded={handleToggleExpanded}
        captionRef={setCaptionRef('image')}
      />
    );
  }, [
    previewMode,
    selectedMediaItems,
    activeSlideItem,
    currentSlideIndex,
    handleTouchStart,
    handleTouchEnd,
    nextSlide,
    prevSlide,
    handleToggleExpanded,
    previewContentState,
    setCaptionRef,
    isExpanded,
    shouldShowSeeMore,
    shouldShowExpandedOverlay
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

          {previewContentState.inlineAlert && (
            <InlineAlert
              message={previewContentState.inlineAlert.message}
              severity={previewContentState.inlineAlert.severity}
            />
          )}

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
