import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import MetaPostPreview from '@/components/preview/common/MetaPostPreview';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import ReelPreview from '@/components/preview/common/ReelPreview';
import { ImportIcon, Play } from 'lucide-react';
import EmptyPostPreview from './EmptyPostPreview';
import EmptyReelPreview from './EmptyReelPreview';

type InstagramPreviewMode = 'post' | 'reel';

function InstagramPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    setMode: setPreviewMode,
    setSelectedMediaIds,
    setCurrentMediaIndex
  } = usePlatformPreviewState('instagram');
  const previewMode = mode as InstagramPreviewMode;
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const activeReelItem = previewMode === 'reel' ? selectedMediaItems[0] : undefined;
  const previewContext = useMemo(() => ({ platform: 'instagram' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );
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

  const renderPostPreview = useCallback(() => {
    return (
      <MetaPostPreview
        platform='instagram'
        captionHtml={previewContentState.previewText}
        mediaItems={selectedMediaItems}
        emptyState={<EmptyPostPreview />}
        onOpenMedia={openModal}
      />
    );
  }, [openModal, previewContentState, selectedMediaItems]);

  const renderReelPreview = useCallback(() => {
    if (activeReelItem?.url)
      return (
        <ReelPreview
          src={activeReelItem.url}
          captionHtml={previewContentState.previewText}
          placeholder='Instagram reel preview'
        />
      );

    return <EmptyReelPreview />;
  }, [activeReelItem, previewContentState]);

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

      <DialogViewMedia
        isOpen={isModalOpen}
        items={selectedMediaItems}
        activeIndex={currentMediaIndex}
        setActiveIndex={setCurrentMediaIndex}
        onClose={() => setIsModalOpen(false)}
        label='Instagram'
      />
    </section>
  );
}

export default InstagramPreview;
