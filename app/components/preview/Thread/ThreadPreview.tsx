import { useCallback, useEffect, useMemo, useState } from 'react';
import useMediaResourceStore from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import MetaPostPreview from '@/components/preview/common/MetaPostPreview';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import MediaSelection from '@/components/preview/common/MediaSelection';
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
        <MediaSelection
          items={visibleGalleryItems}
          selectedIds={selectedMediaIds}
          onChangeSelectedIds={setSelectedMediaIds}
          allowedTypes={['image', 'video']}
          selectedClassName='border-purple-500 ring-2 ring-purple-500/40 opacity-90'
          imageClassName='transition-transform duration-300 group-hover:scale-[1.03]'
        />

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
