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
import { Loader2, Trash2 } from 'lucide-react';

type DialogConfirmUnpublishProps = {
  isOpen: boolean;
  platformLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

function DialogConfirmUnpublish({
  isOpen,
  platformLabel,
  onClose,
  onConfirm,
  isSubmitting = false
}: DialogConfirmUnpublishProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className='border-red-500/20 bg-zinc-950 text-white'>
        <DialogHeader className='space-y-2'>
          <DialogTitle>Unpublish this post?</DialogTitle>
          <DialogDescription className='text-zinc-400'>
            This will remove the post from every connected {platformLabel} account and return it to
            draft. You'll be notified as each account is cleaned up.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='flex justify-end gap-2 sm:flex-row'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              disabled={isSubmitting}
              className='border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={isSubmitting}
            className='inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60'
          >
            {isSubmitting ? <Loader2 className='size-4 animate-spin' /> : <Trash2 className='size-4' />}
            Unpublish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogConfirmUnpublish;
