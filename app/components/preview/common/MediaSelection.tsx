import { cn } from '@/lib/utils';
import { ImportIcon, Play } from 'lucide-react';
import type { TMediaResource } from '@/store/media-resource.store';

type SelectedIdsUpdater = string[] | ((prev: string[]) => string[]);

type MediaSelectionProps = {
  items: TMediaResource[];
  selectedIds: string[];
  onChangeSelectedIds: (nextIds: SelectedIdsUpdater) => void;
  allowedTypes?: string[];
  maxSelected?: number;
  title?: string;
  showImport?: boolean;
  onImport?: () => void;
  selectedClassName?: string;
  disabledClassName?: string;
  imageClassName?: string;
};

const DEFAULT_SELECTED_CLASS = 'border-purple-500 ring-2 ring-purple-500/40 opacity-90';
const DEFAULT_DISABLED_CLASS = 'cursor-not-allowed border-none opacity-35 grayscale';
const DEFAULT_IMAGE_CLASS = 'transition-transform duration-300 group-hover:scale-[1.03]';

function MediaSelection({
  items,
  selectedIds,
  onChangeSelectedIds,
  allowedTypes,
  maxSelected,
  title = 'Select Your Media',
  showImport = true,
  onImport,
  selectedClassName = DEFAULT_SELECTED_CLASS,
  disabledClassName = DEFAULT_DISABLED_CLASS,
  imageClassName = DEFAULT_IMAGE_CLASS
}: MediaSelectionProps) {
  const isTypeAllowed = (type: string) => {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    return allowedTypes.includes(type);
  };

  const handleToggle = (item: TMediaResource) => {
    if (!isTypeAllowed(item.type)) return;

    onChangeSelectedIds((prev) => {
      const isSelected = prev.includes(item.id);

      if (maxSelected === 1) {
        return isSelected ? [] : [item.id];
      }

      if (isSelected) {
        return prev.filter((selectedId) => selectedId !== item.id);
      }

      if (typeof maxSelected === 'number' && maxSelected > 1 && prev.length >= maxSelected) {
        return prev;
      }

      return [...prev, item.id];
    });
  };

  return (
    <div className='space-y-5'>
      <div>
        <h3 className='text-md font-semibold text-white'>{title}</h3>
      </div>

      <div className='min-h-50 space-y-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
        {showImport && (
          <button
            type='button'
            onClick={onImport}
            className='flex h-45 w-45 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 text-zinc-300 transition-colors hover:border-purple-500 hover:text-white'
          >
            <ImportIcon className='h-5 w-5' />
            <span className='text-sm'>Import from your library</span>
          </button>
        )}

        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const isDisabled = !isTypeAllowed(item.type);

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => handleToggle(item)}
              disabled={isDisabled}
              className={cn(
                'group relative h-45 w-45 aspect-square overflow-hidden rounded-lg border bg-zinc-900 text-left',
                isDisabled && disabledClassName,
                isSelected ? selectedClassName : 'border-zinc-700 hover:border-zinc-500'
              )}
            >
              <img
                src={item.thumbnail_url}
                alt={item.name || 'Gallery media item'}
                className={cn('h-full w-full object-cover', imageClassName)}
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
    </div>
  );
}

export default MediaSelection;
