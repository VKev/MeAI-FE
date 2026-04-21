import { Trash2Icon, PlayIcon } from 'lucide-react';
import type { MediaItem } from './media-types';

interface SelectedMediaStripProps {
  selectedItems: MediaItem[];
  onRemove: (id: string) => void;
}

export default function SelectedMediaStrip({ selectedItems, onRemove }: SelectedMediaStripProps) {
  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className='absolute left-2 bottom-3 flex items-center gap-2'>
      {selectedItems.map((item) => (
        <div
          key={item.id}
          className='group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900'
        >
          {item.isVideo ? (
            <>
              <video src={item.url} muted className='h-full w-full object-cover' />
              <div className='absolute bottom-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60'>
                <PlayIcon className='h-2 w-2 text-white fill-white' />
              </div>
            </>
          ) : (
            <img src={item.url} alt='Selected prompt image' className='h-full w-full object-contain' />
          )}
          <button
            type='button'
            onClick={() => onRemove(item.id)}
            className='absolute inset-0 flex items-center justify-center bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100'
            aria-label='Remove selected image'
          >
            <Trash2Icon className='h-4 w-4' />
          </button>
        </div>
      ))}
    </div>
  );
}
