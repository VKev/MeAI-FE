import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore, { type TMediaResource } from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import MetaPostPreview from '@/components/preview/common/MetaPostPreview';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import { ImportIcon, Play } from 'lucide-react';
import EmptyPostPreview from '@/components/preview/Thread/EmptyPostPreview';

function ThreadPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const { selectedMediaIds, currentMediaIndex, setSelectedMediaIds, setCurrentMediaIndex } =
    usePlatformPreviewState('thread');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const context = useMemo(() => ({ platform: 'thread' as const, mode: 'post' as const }), []);
  const previewContentState = useMemo(() => getPreviewContentState({ content, context }), [content, context]);

  const visibleGalleryItems = useMemo(
    () => dataMediaResource.filter((item) => item.type === 'image' || item.type === 'video'),
    [dataMediaResource]
  );

  const selectedMediaItems = useMemo(
    () => visibleGalleryItems.filter((item) => selectedMediaIds.includes(item.id)),
    [visibleGalleryItems, selectedMediaIds]
  );

  useEffect(() => {
    setSelectedMediaIds((prev) => {
      const allowedIds = new Set(visibleGalleryItems.map((item) => item.id));
      return prev.filter((id) => allowedIds.has(id));
    });
  }, [setSelectedMediaIds, visibleGalleryItems]);

  useEffect(() => {
    if (currentMediaIndex > 0 && currentMediaIndex >= selectedMediaItems.length) {
      setCurrentMediaIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentMediaIndex, setCurrentMediaIndex]);

  const toggleSelection = useCallback(
    (item: TMediaResource) => {
      setSelectedMediaIds((prev) => {
        return prev.includes(item.id) ? prev.filter((selectedId) => selectedId !== item.id) : [...prev, item.id];
      });
    },
    [setSelectedMediaIds]
  );

  const openModal = useCallback(
    (index: number) => {
      if (!selectedMediaItems.length) return;
      setCurrentMediaIndex(index);
      setIsModalOpen(true);
    },
    [selectedMediaItems.length, setCurrentMediaIndex, setIsModalOpen]
  );

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
            <div className='w-full max-w-140'>
              <MetaPostPreview
                platform='thread'
                captionHtml={previewContentState.previewText}
                mediaItems={selectedMediaItems}
                emptyState={<EmptyPostPreview />}
                onOpenMedia={openModal}
              />
            </div>
          </div>
        </div>
      </div>

      <DialogViewMedia
        isOpen={isModalOpen}
        items={selectedMediaItems}
        activeIndex={currentMediaIndex}
        setActiveIndex={setCurrentMediaIndex}
        onClose={() => setIsModalOpen(false)}
        label='Threads'
      />
    </section>
  );
}

export default ThreadPreview;
