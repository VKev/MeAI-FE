import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MediaGallery from './MediaGallery';
import type { MediaItem } from './media-types';

interface MediaModalProps {
  isOpen: boolean;
  items: MediaItem[];
  selectedItems: MediaItem[];
  draftSelections: MediaItem[];
  canSelectMore: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: MediaItem) => void;
  onUploadClick: () => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  isLoadingResources?: boolean;
  isUploading?: boolean;
  hasMoreResources?: boolean;
  onLoadMoreResources?: () => void;
}

export default function MediaModal({
  isOpen,
  items,
  selectedItems,
  draftSelections,
  canSelectMore,
  onOpenChange,
  onSelectItem,
  onUploadClick,
  onClose,
  onConfirm,
  confirmDisabled,
  isLoadingResources,
  isUploading,
  hasMoreResources,
  onLoadMoreResources
}: MediaModalProps) {
  const draftCount = draftSelections.length;
  const totalAfterConfirm = selectedItems.length + draftCount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-4xl max-w-[60vw] max-h-[95vh] border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <DialogTitle>Select Media</DialogTitle>
            <span className='text-xs text-zinc-500'>
              {totalAfterConfirm}/3 selected
            </span>
          </div>
        </DialogHeader>

        <div className='overflow-y-auto h-[60vh] w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4'>
          <MediaGallery
            items={items}
            selectedItems={selectedItems}
            draftSelections={draftSelections}
            canSelectMore={canSelectMore}
            onSelectItem={onSelectItem}
            onUploadClick={onUploadClick}
            isLoading={isLoadingResources}
            isUploading={isUploading}
            hasMore={hasMoreResources}
            onLoadMore={onLoadMoreResources}
          />
        </div>

        <DialogFooter className='mt-2 border-t border-zinc-800 py-4 gap-2'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='min-w-36 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={confirmDisabled}
            className='min-w-36 bg-purple-600 text-white hover:bg-purple-700'
          >
            {draftCount > 0 ? `Confirm (${draftCount})` : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
