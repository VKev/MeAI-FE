import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import useMediaResourceStore from '@/store/media-resource.store';
import { ImportIcon } from 'lucide-react';

type PreviewMode = 'video' | 'image';

type MediaResourceItem = {
  id: string;
  name: string;
  type: string;
  url: string;
};

function TiktokPreview() {
  const dataMediaResource = useMediaResourceStore((state) => state.mediaResources);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('video');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleGalleryItems = useMemo(() => dataMediaResource as MediaResourceItem[], [dataMediaResource]);

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

  const toggleSelection = (item: MediaResourceItem) => {
    if (item.type !== previewMode) return;

    setSelectedMediaIds((prev) => {
      if (previewMode === 'video') {
        return prev.includes(item.id) ? [] : [item.id];
      }

      return prev.includes(item.id) ? prev.filter((selectedId) => selectedId !== item.id) : [...prev, item.id];
    });
  };

  return (
    <section className='rounded-2xl border border-white/10 bg-zinc-950 p-4 lg:p-6'>
      <div className='space-y-5'>
        <div>
          <h3 className='text-md font-semibold text-white'>Select Your Media</h3>
        </div>

        <div className='min-h-50 space-y-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
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
                  'relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
                  isDisabled && 'cursor-not-allowed border-none opacity-40 grayscale',
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/40 opacity-80'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <img src={item.url} alt={item.name || 'Gallery media item'} className='h-full w-full object-cover' />

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
                'rounded-full px-3 py-2 text-md font-medium transition',
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
                'rounded-full px-3 py-2 text-md font-medium transition',
                previewMode === 'image'
                  ? 'bg-purple-500/25 text-purple-100 ring-1 ring-purple-300/40'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              )}
            >
              Image mode
            </button>
          </div>

          {/* tiktok ui preview ở đây */}
          <p className='mt-3 text-xs text-zinc-400'>
            Dang o <span className='font-semibold text-zinc-200'>{previewMode}</span> mode, da chon{' '}
            <span className='font-semibold text-zinc-200'>{selectedMediaIds.length}</span> item.
          </p>
        </div>
      </div>
    </section>
  );
}

export default TiktokPreview;
