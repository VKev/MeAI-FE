import { useCallback, useEffect, useMemo, useState } from 'react';
import useMediaResourceStore from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import MetaPostPreview from '@/components/preview/common/MetaPostPreview';
import DialogViewMedia from '@/components/preview/common/DialogViewMedia';
import MediaSelection from '@/components/preview/common/MediaSelection';
import ReelPreview from '@/components/preview/common/ReelPreview';
import EmptyPostPreview from '@/components/preview/Facebook/EmptyPostPreview';
import EmptyReelPreview from '@/components/preview/Facebook/EmptyReelPreview';
import InlineAlert from '@/components/preview/common/InlineAlert';
import MetaPreviewMode from '@/components/preview/common/MetaPreviewMode';

type FacebookPreviewMode = 'post' | 'reel';

function FacebookPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const { mode, selectedMediaIds, currentMediaIndex, setMode, setSelectedMediaIds, setCurrentMediaIndex } =
    usePlatformPreviewState('facebook');
  const previewMode = mode as FacebookPreviewMode;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleGalleryItems = useMemo(
    () => dataMediaResource.filter((item) => item.type === 'image' || item.type === 'video'),
    [dataMediaResource]
  );

  const selectedMediaItems = useMemo(
    () =>
      visibleGalleryItems.filter((item) => {
        if (!selectedMediaIds.includes(item.id)) return false;

        // Facebook reels support both video and single-image (Photo Reels).
        if (previewMode === 'reel') return item.type === 'video' || item.type === 'image';

        return item.type === 'image' || item.type === 'video';
      }),
    [visibleGalleryItems, selectedMediaIds, previewMode]
  );

  const activeReelItem = previewMode === 'reel' ? selectedMediaItems[0] : undefined;
  const previewContext = useMemo(() => ({ platform: 'facebook' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );
  useEffect(() => {
    setSelectedMediaIds((prev) => {
      const allowedIds = new Set(
        visibleGalleryItems
          .filter(() => true) // Facebook accepts image + video in both post and reel modes.
          .map((item) => item.id)
      );
      const nextSelected = prev.filter((id) => allowedIds.has(id));

      // Reel mode follows Facebook behavior: one reel post accepts exactly one media (video or photo reel).
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
        platform='facebook'
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
          mediaType={activeReelItem.type === 'image' ? 'image' : 'video'}
          captionHtml={previewContentState.previewText}
          placeholder='Facebook reel preview'
        />
      );

    return <EmptyReelPreview />;
  }, [activeReelItem, previewContentState]);

  return (
    <section className='rounded-2xl border border-white/10 bg-zinc-950 p-4 lg:p-6'>
      <div className='space-y-5'>
        <MediaSelection
          items={visibleGalleryItems}
          selectedIds={selectedMediaIds}
          onChangeSelectedIds={setSelectedMediaIds}
          allowedTypes={['image', 'video']}
          maxSelected={previewMode === 'reel' ? 1 : undefined}
          disabledClassName='cursor-not-allowed border-none opacity-35 grayscale'
          selectedClassName='border-purple-500 ring-2 ring-purple-500/40 opacity-90'
          imageClassName='transition-transform duration-300 group-hover:scale-[1.03]'
        />

        <div className='border-t border-white/10 pt-4'>
          <MetaPreviewMode previewMode={previewMode} setPreviewMode={setMode} />

          {previewContentState.inlineAlert && (
            <InlineAlert
              message={previewContentState.inlineAlert.message}
              severity={previewContentState.inlineAlert.severity}
            />
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
        label='Facebook'
      />
    </section>
  );
}

export default FacebookPreview;
