import { useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore from '@/store/media-resource.store';
import usePostBuilder, { getPreviewContentState } from '@/routes/post-builder/hooks/usePostBuilder';
import usePlatformPreviewState from '@/routes/post-builder/hooks/usePlatformPreviewState';
import TiktokImagePreview from '@/components/preview/common/TiktokImagePreview';
import TiktokVideoPreview from '@/components/preview/common/TiktokVideoPreview';
import MediaSelection from '@/components/preview/common/MediaSelection';
import InlineAlert from '@/components/preview/common/InlineAlert';
import PublishedBanner from '@/components/preview/common/PublishedBanner';

type PreviewMode = 'video' | 'image';

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

  const activeVideoItem = previewMode === 'video' ? selectedMediaItems[0] : undefined;
  const activeSlideItem = previewMode === 'image' ? selectedMediaItems[currentSlideIndex] : undefined;
  const previewContext = useMemo(() => ({ platform: 'tiktok' as const, mode: previewMode }), [previewMode]);
  const previewContentState = useMemo(
    () => getPreviewContentState({ content, context: previewContext }),
    [content, previewContext]
  );
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

  const renderVideoPreview = useCallback(() => {
    if (previewMode !== 'video') return null;

    return <TiktokVideoPreview src={activeVideoItem?.url} captionHtml={previewContentState.previewText} />;
  }, [previewMode, activeVideoItem, previewContentState]);

  const renderImagePreview = useCallback(() => {
    if (previewMode !== 'image') return null;

    return (
      <TiktokImagePreview
        items={selectedMediaItems}
        activeItem={activeSlideItem}
        currentIndex={currentSlideIndex}
        onChangeIndex={setCurrentMediaIndex}
        captionHtml={previewContentState.previewText}
      />
    );
  }, [previewMode, selectedMediaItems, activeSlideItem, currentSlideIndex, setCurrentMediaIndex, previewContentState]);

  return (
    <section className='rounded-2xl border border-white/10 bg-zinc-950 p-4 lg:p-6'>
      <div className='space-y-5'>
        <PublishedBanner platformLabel={`TikTok ${previewMode}`} info={publishInfoForMode} />

        <div className={isPublished ? 'opacity-60 pointer-events-none' : ''}>
          <MediaSelection
            items={visibleGalleryItems}
            selectedIds={selectedMediaIds}
            onChangeSelectedIds={setSelectedMediaIds}
            allowedTypes={[previewMode]}
            maxSelected={previewMode === 'video' ? 1 : undefined}
            disabledClassName='cursor-not-allowed border-none opacity-40 grayscale'
            selectedClassName='border-purple-500 ring-2 ring-purple-500/40 opacity-80'
            imageClassName=''
          />
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
