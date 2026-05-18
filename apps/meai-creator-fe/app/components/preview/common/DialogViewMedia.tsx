import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TMediaResource } from '@/store/media-resource.store';

type MediaIndexUpdater = number | ((prev: number) => number);

type DialogViewMediaProps = {
  isOpen: boolean;
  items: TMediaResource[];
  activeIndex: number;
  setActiveIndex: (nextIndex: MediaIndexUpdater) => void;
  onClose: () => void;
  label?: string;
};

function DialogViewMedia({
  isOpen,
  items,
  activeIndex,
  setActiveIndex,
  onClose,
  label = 'Media'
}: DialogViewMediaProps) {
  const activeItem = items[activeIndex];
  const hasMultiple = items.length > 1;

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % items.length);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, onClose, setActiveIndex]);

  if (!isOpen || !activeItem) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4' onClick={onClose}>
      <div className='relative w-full max-w-5xl' onClick={(event) => event.stopPropagation()}>
        {hasMultiple && (
          <>
            <button
              type='button'
              onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
              className='absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/65 p-2 text-white hover:bg-black/85 md:-left-14'
              aria-label='Previous media'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>

            <button
              type='button'
              onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
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
              onClick={onClose}
              className='rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white'
              aria-label='Close modal'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <div className='relative max-h-[70vh] min-h-80 bg-black'>
            {activeItem.type === 'video' && activeItem.url ? (
              <video src={activeItem.url} controls autoPlay className='h-[70vh] w-full object-contain' />
            ) : (
              <img
                src={activeItem.thumbnail_url || activeItem.url}
                alt={activeItem.name || `${label} modal media`}
                className='h-[70vh] w-full object-contain'
              />
            )}
          </div>

          {hasMultiple && (
            <div className='border-t border-zinc-800 px-3 py-3'>
              <div className='flex gap-2 overflow-x-auto'>
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border',
                      index === activeIndex ? 'border-blue-400 ring-2 ring-blue-400/40' : 'border-zinc-700'
                    )}
                  >
                    {item.type === 'video' && item.url ? (
                      <video src={item.url} muted className='h-full w-full object-cover' />
                    ) : (
                      <img
                        src={item.thumbnail_url || item.url}
                        alt={item.name || 'Media thumbnail'}
                        className='h-full w-full object-cover'
                      />
                    )}
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
  );
}

export default DialogViewMedia;
