import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Loader2Icon, Trash2Icon } from 'lucide-react';

interface DialogConfirmDeleteProps {
  isOpen: boolean;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DialogConfirmDelete({
  isOpen,
  isLoading = false,
  onCancel,
  onConfirm
}: DialogConfirmDeleteProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent className='border border-rose-500/20 bg-zinc-950 text-white shadow-[0_20px_70px_-40px_rgba(244,63,94,0.6)]'>
        <DialogHeader className='space-y-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300'>
            <Trash2Icon className='h-5 w-5' />
          </div>
          <div className='space-y-1'>
            <DialogTitle className='text-xl font-semibold tracking-tight'>Delete this generation?</DialogTitle>
            <DialogDescription className='text-zinc-400'>This action cannot be undone.</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isLoading}
              className='w-full border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 sm:w-auto'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
            className='w-full bg-rose-600 text-white hover:bg-rose-500 sm:w-auto'
          >
            {isLoading ? <Loader2Icon className='mr-2 h-4 w-4 animate-spin' /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
