import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DialogClose } from '@radix-ui/react-dialog';

const GENERATION_IMAGES = [
  {
    id: 'gen-1',
    url: 'https://cdn.leonardo.ai/users/61b12163-b5db-448c-9fc7-816eba537f81/generations/17fe4c94-9560-4e79-8468-f70f08e95b10/segments/1:1:1/Lucid_Origin_bmw_530i_with_sleek_red_metal_color_featuring_a_p_0.jpg',
    source: 'generation'
  },
  {
    id: 'gen-2',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  },
  {
    id: 'gen-3',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  },
  {
    id: 'gen-4',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  },
  {
    id: 'gen-5',
    url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=80',
    source: 'generation'
  }
];

type DialogImportUserMediaProps = {
  isOpen: boolean;
  onClose: () => void;
  handleAdd: () => void;
  limit?: number;
};

function DialogImportUserMedia({ isOpen, onClose, handleAdd, limit = 3 }: DialogImportUserMediaProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  const selectedCount = selectedIds.length;
  const isAtLimit = selectedCount >= limit;
  const galleryItems = useMemo(() => GENERATION_IMAGES, []);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);

      if (isSelected) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      if (isAtLimit) {
        return prev;
      }

      return [...prev, id];
    });
  };

  const handleConfirmAdd = () => {
    console.log(selectedIds);
    handleAdd();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='min-w-4xl max-w-7xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <DialogTitle>Select Media</DialogTitle>
            <span className='text-sm text-zinc-400'>
              {selectedCount}/{limit} selected
            </span>
          </div>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-y-auto px-6 py-5'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
            {galleryItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isLocked = !isSelected && isAtLimit;

              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => toggleSelected(item.id)}
                  disabled={isLocked}
                  className={cn(
                    'group relative h-45 w-45 overflow-hidden rounded-lg border bg-zinc-900 text-left',
                    isLocked && 'cursor-not-allowed opacity-40 grayscale border-none',
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/40' : 'border-zinc-700 hover:border-zinc-500'
                  )}
                >
                  <img
                    src={item.url}
                    alt='Gallery media item'
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                  />
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className='border-t border-zinc-800 px-6 py-4'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='min-w-32 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
              >
                Close
              </Button>
            </DialogClose>
            <Button
              type='button'
              onClick={handleConfirmAdd}
              disabled={selectedCount === 0}
              className='min-w-32 bg-purple-600 text-white hover:bg-purple-700'
            >
              Add
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogImportUserMedia;
