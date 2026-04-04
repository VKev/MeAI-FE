import { ImagePlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem, MediaTab } from './media-types';

interface MediaGalleryProps {
  activeMediaTab: MediaTab;
  items: MediaItem[];
  selectedItems: MediaItem[];
  draftSelection: MediaItem | null;
  onSelectItem: (item: MediaItem) => void;
  onUploadClick: () => void;
}

export default function MediaGallery({
  activeMediaTab,
  items,
  selectedItems,
  draftSelection,
  onSelectItem,
  onUploadClick
}: MediaGalleryProps) {
  return (
    <div className='flex flex-wrap gap-4'>
      {activeMediaTab === 'uploads' ? (
        <button
          type='button'
          onClick={onUploadClick}
          className='flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 text-zinc-300 transition-colors hover:border-purple-500 hover:text-white'
        >
          <ImagePlusIcon className='h-5 w-5' />
          <span className='text-sm'>Upload image</span>
        </button>
      ) : null}
      {items.map((item) => {
        const isSelected = draftSelection?.id === item.id;
        const isDisabled = selectedItems.some((selectedItem) => selectedItem.id === item.id);

        return (
          <button
            key={item.id}
            type='button'
            onClick={() => onSelectItem(item)}
            disabled={isDisabled}
            className={cn(
              'relative h-45 w-45 shrink-0 overflow-hidden rounded-lg border bg-zinc-900',
              isDisabled && 'cursor-not-allowed opacity-40 grayscale border-none',
              isSelected ? 'border-purple-500 ring-2 ring-purple-500/40' : 'border-zinc-700 hover:border-zinc-500'
            )}
          >
            <img src={item.url} alt='Gallery media item' className='h-full w-full object-cover' />
          </button>
        );
      })}
    </div>
  );
}
