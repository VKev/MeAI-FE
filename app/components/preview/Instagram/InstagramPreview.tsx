import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import VideoPreview from '@/components/preview/common/VideoPreview';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  ImportIcon,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Share2,
  X
} from 'lucide-react';
import EmptyPostPreview from './EmptyPostPreview';
import EmptyReelPreview from './EmptyReelPreview';
import MetaVideoMedia from '@/components/preview/common/MetaVideoMedia';

type InstagramPreviewMode = 'post' | 'reel';

function InstagramPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    isModalOpen,
    isExpanded,
    isMuted: isReelMuted,
    setMode: setPreviewMode,
    setSelectedMediaIds,
    setCurrentMediaIndex,
    setIsModalOpen,
    setIsExpanded,
    setIsMuted
  } = usePlatformPreviewState('instagram');
  const previewMode = mode as InstagramPreviewMode;
  const [overflowByMode, setOverflowByMode] = useState<Record<InstagramPreviewMode, boolean>>({
    post: false,
    reel: false
  });
  const captionRefs = useRef<Record<InstagramPreviewMode, HTMLDivElement | null>>({ post: null, reel: null });

  const visibleGalleryItems = useMemo(
    () => dataMediaResource.filter((item) => item.type === 'image' || item.type === 'video'),
    [dataMediaResource]
  );

  const selectedMediaItems = useMemo(
    () =>
      visibleGalleryItems.filter((item) => {
        if (!selectedMediaIds.includes(item.id)) return false;

        if (previewMode === 'reel') return item.type === 'video';

        return item.type === 'image' || item.type === 'video';
      }),
    [visibleGalleryItems, selectedMediaIds, previewMode]
  );

  const activeModalItem = selectedMediaItems[currentMediaIndex];
  const activeReelItem = previewMode === 'reel' ? selectedMediaItems[0] : undefined;
  const previewContext = useMemo(() => ({ platform: 'instagram' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );
  const shouldShowSeeMore = overflowByMode[previewMode];
  const shouldShowExpandedOverlay = previewMode === 'reel' && isExpanded && shouldShowSeeMore;

  const setCaptionRef = useCallback(
    (mode: InstagramPreviewMode) => (node: HTMLDivElement | null) => {
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
        visibleGalleryItems
          .filter((item) =>
            previewMode === 'reel' ? item.type === 'video' : item.type === 'image' || item.type === 'video'
          )
          .map((item) => item.id)
      );
      const nextSelected = prev.filter((id) => allowedIds.has(id));

      // Reel mode accepts one video only.
      if (previewMode === 'reel' && nextSelected.length > 1) {
        return [nextSelected[0]];
      }

      return nextSelected;
    });
  }, [previewMode, setSelectedMediaIds, visibleGalleryItems]);

  useEffect(() => {
    if (currentMediaIndex > 0 && currentMediaIndex >= selectedMediaItems.length) {
      setCurrentMediaIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentMediaIndex, setCurrentMediaIndex]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        return;
      }

      if (event.key === 'ArrowRight') {
        setCurrentMediaIndex((prev) => (prev + 1) % selectedMediaItems.length);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setCurrentMediaIndex((prev) => (prev - 1 + selectedMediaItems.length) % selectedMediaItems.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedMediaItems.length, setCurrentMediaIndex, setIsModalOpen]);

  const toggleSelection = useCallback(
    (item: TMediaResource) => {
      const isDisabledInReelMode = previewMode === 'reel' && item.type !== 'video';
      if (isDisabledInReelMode) return;

      setSelectedMediaIds((prev) => {
        if (previewMode === 'reel') {
          return prev.includes(item.id) ? [] : [item.id];
        }

        return prev.includes(item.id) ? prev.filter((selectedId) => selectedId !== item.id) : [...prev, item.id];
      });
    },
    [previewMode, setSelectedMediaIds]
  );

  const openModal = useCallback(
    (index: number) => {
      if (!selectedMediaItems.length) return;
      setCurrentMediaIndex(index);
      setIsModalOpen(true);
    },
    [selectedMediaItems.length, setCurrentMediaIndex, setIsModalOpen]
  );

  const goToNextMedia = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentMediaIndex((prev) => (prev + 1) % selectedMediaItems.length);
  }, [selectedMediaItems.length, setCurrentMediaIndex]);

  const goToPrevMedia = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentMediaIndex((prev) => (prev - 1 + selectedMediaItems.length) % selectedMediaItems.length);
  }, [selectedMediaItems.length, setCurrentMediaIndex]);

  const handleToggleReelMute = useCallback(() => {
    setIsMuted(!isReelMuted);
  }, [isReelMuted, setIsMuted]);

  const renderPostGrid = useCallback(() => {
    if (!selectedMediaItems.length) {
      return <EmptyPostPreview />;
    }

    const visibleItems = selectedMediaItems.slice(0, 4);
    const restCount = Math.max(selectedMediaItems.length - 4, 0);

    const getGridClass = () => {
      if (visibleItems.length === 1) return 'grid-cols-1';
      if (visibleItems.length === 2) return 'grid-cols-2';
      if (visibleItems.length === 3) return 'grid-cols-3';
      return 'grid-cols-2';
    };

    const getAspectClass = () => {
      if (visibleItems.length === 1) return 'aspect-video';
      if (visibleItems.length === 2) return 'aspect-square';
      if (visibleItems.length === 3) return 'aspect-square';
      return 'aspect-square';
    };

    return (
      <div className='overflow-hidden rounded-2xl bg-black'>
        <div className={cn('grid gap-1', getGridClass())}>
          {visibleItems.map((item, index) => {
            const isVideo = item.type === 'video';
            const mediaSrc = item.thumbnail_url || item.url;
            const isOverflowTile = restCount > 0 && index === 3;

            return (
              <button
                key={item.id}
                type='button'
                onClick={() => openModal(index)}
                className={cn('group relative overflow-hidden bg-zinc-900', getAspectClass())}
              >
                <img
                  src={mediaSrc}
                  alt={item.name || 'Instagram post media'}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]'
                />

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
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [selectedMediaItems, openModal]);

  const renderPostPreview = useCallback(() => {
    return (
      <article className='overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950'>
        <div className='border-b border-zinc-800 p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white'>
                MA
              </div>
              <div>
                <div className='text-sm font-semibold text-white'>MeAI Creator</div>
                <div className='flex items-center gap-1 text-xs text-zinc-400'>
                  <span>Just now</span>
                  <span>&middot;</span>
                  <Globe className='h-3.5 w-3.5' />
                </div>
              </div>
            </div>

            <button
              type='button'
              className='rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white'
            >
              <MoreHorizontal className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='p-1'>{renderPostGrid()}</div>

        <div className='border-t border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200'>
          <div
            ref={setCaptionRef('post')}
            className={cn('text-sm max-w-full text-white/90 leading-relaxed wrap-break-word prose prose-invert')}
            dangerouslySetInnerHTML={{ __html: previewContentState.previewText || 'Instagram post preview' }}
          />
        </div>
      </article>
    );
  }, [renderPostGrid, previewContentState, setCaptionRef, isExpanded, shouldShowSeeMore]);

  const renderReelPreview = useCallback(() => {
    if (activeReelItem)
      return (
        <VideoPreview
          src={activeReelItem.url}
          isMuted={isReelMuted}
          onToggleMute={handleToggleReelMute}
          mediaLabel='reel'
        >
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
                ref={setCaptionRef('reel')}
                className={cn(
                  'mt-1 text-sm max-w-70 text-white/90 transition-all wrap-break-word prose prose-invert',
                  isExpanded ? 'max-h-120 overflow-y-auto' : 'max-h-20 overflow-hidden'
                )}
                dangerouslySetInnerHTML={{
                  __html: previewContentState.previewText || 'Instagram reel preview'
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

            <MetaVideoMedia />
          </div>
        </VideoPreview>
      );

    return <EmptyReelPreview />;
  }, [
    activeReelItem,
    handleToggleReelMute,
    isReelMuted,
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
            const isDisabled = previewMode === 'reel' && item.type !== 'video';

            return (
              <button
                key={item.id}
                type='button'
                onClick={() => toggleSelection(item)}
                disabled={isDisabled}
                className={cn(
                  'group relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
                  isDisabled && 'cursor-not-allowed border-none opacity-35 grayscale',
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/40 opacity-90'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <img
                  src={item.thumbnail_url}
                  alt={item.name || 'Gallery media item'}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
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
              onClick={() => setPreviewMode('post')}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                previewMode === 'post'
                  ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              )}
            >
              Post mode
            </button>

            <button
              type='button'
              onClick={() => setPreviewMode('reel')}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                previewMode === 'reel'
                  ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              )}
            >
              Reel mode
            </button>
          </div>

          {previewContentState.inlineAlert && (
            <div
              className={cn(
                'mt-4 rounded-md border px-3 py-2 text-sm',
                previewContentState.inlineAlert.severity === 'recommend' &&
                  'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
                previewContentState.inlineAlert.severity === 'warn' &&
                  'border-amber-500/40 bg-amber-500/10 text-amber-200',
                previewContentState.inlineAlert.severity === 'block' &&
                  'border-rose-500/40 bg-rose-500/10 text-rose-200'
              )}
              role='alert'
            >
              {previewContentState.inlineAlert.message}
            </div>
          )}

          <div className='mt-4 flex justify-center'>
            {previewMode === 'post' ? (
              <div className='w-full max-w-140'>{renderPostPreview()}</div>
            ) : (
              <div className='relative h-180 w-100 overflow-hidden rounded-[30px] border border-white/15 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.65)]'>
                {renderReelPreview()}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && activeModalItem && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4'
          onClick={() => setIsModalOpen(false)}
        >
          <div className='relative w-full max-w-5xl' onClick={(event) => event.stopPropagation()}>
            {selectedMediaItems.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={goToPrevMedia}
                  className='absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/65 p-2 text-white hover:bg-black/85 md:-left-14'
                  aria-label='Previous media'
                >
                  <ChevronLeft className='h-5 w-5' />
                </button>

                <button
                  type='button'
                  onClick={goToNextMedia}
                  className='absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/65 p-2 text-white hover:bg-black/85 md:-right-14'
                  aria-label='Next media'
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </>
            )}

            <div className='overflow-hidden rounded-2xl bg-zinc-950'>
              <div className='flex items-center justify-end border-b border-zinc-800 px-4 py-2'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white'
                  aria-label='Close modal'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='relative max-h-[70vh] min-h-80 bg-black'>
                {activeModalItem.type === 'video' && activeModalItem.url ? (
                  <video src={activeModalItem.url} controls autoPlay className='h-[70vh] w-full object-contain' />
                ) : (
                  <img
                    src={activeModalItem.thumbnail_url || activeModalItem.url}
                    alt={activeModalItem.name || 'Instagram modal media'}
                    className='h-[70vh] w-full object-contain'
                  />
                )}
              </div>

              {selectedMediaItems.length > 1 && (
                <div className='border-t border-zinc-800 px-3 py-3'>
                  <div className='flex gap-2 overflow-x-auto'>
                    {selectedMediaItems.map((item, index) => (
                      <button
                        key={item.id}
                        type='button'
                        onClick={() => setCurrentMediaIndex(index)}
                        className={cn(
                          'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border',
                          index === currentMediaIndex ? 'border-blue-400 ring-2 ring-blue-400/40' : 'border-zinc-700'
                        )}
                      >
                        <img
                          src={item.thumbnail_url}
                          alt={item.name || 'Media thumbnail'}
                          className='h-full w-full object-cover'
                        />
                        {item.type === 'video' && (
                          <span className='absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white'>
                            <Play className='h-3 w-3 fill-white text-white' />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InstagramPreview;
