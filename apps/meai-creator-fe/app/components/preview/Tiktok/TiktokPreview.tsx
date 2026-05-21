import { useEffect, useMemo } from 'react';
import useMediaResourceStore from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import TiktokImagePreview from '@/components/preview/common/TiktokImagePreview';
import MediaSelection from '@/components/preview/common/MediaSelection';
import InlineAlert from '@/components/preview/common/InlineAlert';
import PublishedBanner from '@/components/preview/common/PublishedBanner';

type PreviewMode = 'image';

function TiktokPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const content = usePostBuilder((state) => state.content);
  const tiktokPublishStates = usePostBuilder((state) => state.platformPublishStates.tiktok);
  const {
    mode,
    selectedMediaIds,
    currentMediaIndex,
    setMode: setPreviewMode,
    setSelectedMediaIds,
    setCurrentMediaIndex
  } = usePlatformPreviewState('tiktok');
  const previewMode = mode as PreviewMode;
  const currentSlideIndex = currentMediaIndex;
  const publishInfoForMode = tiktokPublishStates?.[previewMode];
  const isPublished = publishInfoForMode?.isPublished === true;

  const visibleGalleryItems = useMemo(() => dataMediaResource, [dataMediaResource]);
  const selectedMediaItems = useMemo(
    () =>
      visibleGalleryItems.filter((item) => {
        if (!selectedMediaIds.includes(item.id)) return false;
        return item.type === previewMode;
      }),
    [visibleGalleryItems, selectedMediaIds, previewMode]
  );

  const activeSlideItem = previewMode === 'image' ? selectedMediaItems[currentSlideIndex] : undefined;
  const previewContext = useMemo(() => ({ platform: 'tiktok' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );

  useEffect(() => {
    if (previewMode !== 'image') {
      setPreviewMode('image');
      return;
    }

    setSelectedMediaIds((prev) => {
      const allowedIds = new Set(visibleGalleryItems.filter((item) => item.type === 'image').map((item) => item.id));
      const nextSelected = prev.filter((id) => allowedIds.has(id));

      return nextSelected;
    });
  }, [previewMode, setPreviewMode, setSelectedMediaIds, visibleGalleryItems]);

  useEffect(() => {
    if (currentSlideIndex > 0 && currentSlideIndex >= selectedMediaItems.length) {
      setCurrentMediaIndex(Math.max(0, selectedMediaItems.length - 1));
    }
  }, [selectedMediaItems, currentSlideIndex, setCurrentMediaIndex]);

  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [previewMode, setCurrentMediaIndex]);

  return (
    <section className='rounded-2xl border border-white/10 bg-zinc-950 p-4 lg:p-6'>
      <div className='space-y-5'>
        <PublishedBanner platformLabel={`TikTok ${previewMode}`} info={publishInfoForMode} />

        <div className={isPublished ? 'opacity-60 pointer-events-none' : ''}>
          <MediaSelection
            items={visibleGalleryItems}
            selectedIds={selectedMediaIds}
            onChangeSelectedIds={setSelectedMediaIds}
            allowedTypes={['image']}
            maxSelected={undefined}
            disabledClassName='cursor-not-allowed border-none opacity-40 grayscale'
            selectedClassName='border-purple-500 ring-2 ring-purple-500/40 opacity-80'
            imageClassName=''
          />

          <div className='border-t border-white/10 pt-4'>
            {previewContentState.inlineAlert && (
              <InlineAlert
                message={previewContentState.inlineAlert.message}
                severity={previewContentState.inlineAlert.severity}
              />
            )}

            <div className='mt-4 flex justify-center'>
              <div className='relative h-180 w-100 overflow-hidden rounded-[30px] border border-white/15 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.65)]'>
                <TiktokImagePreview
                  items={selectedMediaItems}
                  activeItem={activeSlideItem}
                  currentIndex={currentSlideIndex}
                  onChangeIndex={setCurrentMediaIndex}
                  captionHtml={previewContentState.previewText}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TiktokPreview;
