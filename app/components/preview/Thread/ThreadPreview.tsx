import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import { ChevronLeft, ChevronRight, Globe, ImportIcon, MoreHorizontal, Play, X } from 'lucide-react';
import EmptyPostPreview from '@/components/preview/Thread/EmptyPostPreview';

function ThreadPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const setPlatformMode = usePostBuilder((state) => state.setPlatformMode);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const captionRef = useRef<HTMLDivElement | null>(null);

  const context = useMemo(() => ({ platform: 'thread' as const, mode: 'post' as const }), []);
  const previewContentState = useMemo(() => getPreviewContentState({ content, context }), [content, context]);

  const setCaptionRef = useCallback((node: HTMLDivElement | null) => {
    captionRef.current = node;
  }, []);

  useEffect(() => {
    setPlatformMode('thread', 'post');
  }, [setPlatformMode]);

  useEffect(() => {
    if (isExpanded) return;
    const captionNode = captionRef.current;
    if (!captionNode) return;

    const frameId = window.requestAnimationFrame(() => {
      const hasOverflow_ = captionNode.scrollHeight > captionNode.clientHeight + 1;
      setHasOverflow(hasOverflow_);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isExpanded, content]);

  const visibleGalleryItems = useMemo(
    () => dataMediaResource.filter((item) => item.type === 'image' || item.type === 'video'),
    [dataMediaResource]
  );

  const selectedMediaItems = useMemo(
    () => visibleGalleryItems.filter((item) => selectedMediaIds.includes(item.id)),
    [visibleGalleryItems, selectedMediaIds]
  );

  const activeModalItem = selectedMediaItems[currentMediaIndex];

  useEffect(() => {
    setSelectedMediaIds((prev) => {
      const allowedIds = new Set(visibleGalleryItems.map((item) => item.id));
      return prev.filter((id) => allowedIds.has(id));
    });
  }, [visibleGalleryItems]);

  useEffect(() => {
    if (currentMediaIndex > 0 && currentMediaIndex >= selectedMediaItems.length) {
      setCurrentMediaIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentMediaIndex]);

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
  }, [isModalOpen, selectedMediaItems.length]);

  const toggleSelection = useCallback((item: TMediaResource) => {
    setSelectedMediaIds((prev) => {
      return prev.includes(item.id) ? prev.filter((selectedId) => selectedId !== item.id) : [...prev, item.id];
    });
  }, []);

  const openModal = useCallback(
    (index: number) => {
      if (!selectedMediaItems.length) return;
      setCurrentMediaIndex(index);
      setIsModalOpen(true);
    },
    [selectedMediaItems.length]
  );

  const goToNextMedia = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentMediaIndex((prev) => (prev + 1) % selectedMediaItems.length);
  }, [selectedMediaItems.length]);

  const goToPrevMedia = useCallback(() => {
    if (!selectedMediaItems.length) return;
    setCurrentMediaIndex((prev) => (prev - 1 + selectedMediaItems.length) % selectedMediaItems.length);
  }, [selectedMediaItems.length]);

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
                  alt={item.name || 'Threads post media'}
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

            return (
              <button
                key={item.id}
                type='button'
                onClick={() => toggleSelection(item)}
                className={cn(
                  'group relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
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
          <div className='mb-3 text-md font-semibold text-white'>Thread Post Preview</div>

          <div className='mt-4 flex justify-center'>
            <article className='w-full max-w-140 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950'>
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

              <div className='border-b border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200'>
                <div
                  ref={setCaptionRef}
                  className={cn('text-sm max-w-full text-white/90 leading-relaxed wrap-break-word prose prose-invert')}
                  dangerouslySetInnerHTML={{ __html: previewContentState.previewText || 'Thread post preview' }}
                />
              </div>

              <div className='p-1'>{renderPostGrid()}</div>
            </article>
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
                    alt={activeModalItem.name || 'Threads modal media'}
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

export default ThreadPreview;
