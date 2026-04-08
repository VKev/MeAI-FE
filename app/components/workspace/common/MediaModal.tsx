import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2Icon } from 'lucide-react';
import MediaGallery from './MediaGallery';
import type { MediaItem, MediaTab } from './media-types';

interface MediaModalProps {
  isOpen: boolean;
  activeMediaTab: MediaTab;
  items: MediaItem[];
  selectedItems: MediaItem[];
  draftSelection: MediaItem | null;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: MediaTab) => void;
  onSelectItem: (item: MediaItem) => void;
  onUploadClick: () => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  onDeleteSelectedUpload: () => void;
  deleteDisabled: boolean;
}

export default function MediaModal({
  isOpen,
  activeMediaTab,
  items,
  selectedItems,
  draftSelection,
  onOpenChange,
  onTabChange,
  onSelectItem,
  onUploadClick,
  onClose,
  onConfirm,
  confirmDisabled,
  onDeleteSelectedUpload,
  deleteDisabled
}: MediaModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-4xl max-w-[60vw] max-h-[95vh] border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        <Tabs value={activeMediaTab} onValueChange={(value) => onTabChange(value as MediaTab)}>
          <TabsList variant='line' className='bg-transparent border-none p-0 gap-2'>
            <TabsTrigger
              value='uploads'
              className='rounded-none border-0 border-b-2 border-transparent px-2 py-2 text-zinc-400 hover:text-white data-[state=active]:border-purple-500 data-[state=active]:text-white data-[state=active]:bg-transparent'
            >
              Your Uploads
            </TabsTrigger>
            <TabsTrigger
              value='generations'
              className='rounded-none border-0 border-b-2 border-transparent px-2 py-2 text-zinc-400 hover:text-white data-[state=active]:border-purple-500 data-[state=active]:text-white data-[state=active]:bg-transparent'
            >
              Your Generations
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='overflow-y-auto h-[60vh] w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4'>
          <MediaGallery
            activeMediaTab={activeMediaTab}
            items={items}
            selectedItems={selectedItems}
            draftSelection={draftSelection}
            onSelectItem={onSelectItem}
            onUploadClick={onUploadClick}
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
          <div className='flex items-center gap-3'>
            {activeMediaTab === 'uploads' ? (
              <Button
                type='button'
                variant='destructive'
                size='icon'
                onClick={onDeleteSelectedUpload}
                disabled={deleteDisabled}
                className='text-zinc-200'
                aria-label='Delete selected uploaded image'
              >
                <Trash2Icon className='h-4 w-4' />
              </Button>
            ) : null}
            <Button
              type='button'
              onClick={onConfirm}
              disabled={confirmDisabled}
              className='min-w-36 bg-purple-600 text-white hover:bg-purple-700'
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
