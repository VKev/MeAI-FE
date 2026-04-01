import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

type DialogConfirmPublishProps = {
  isOpen: boolean;
  onClose: () => void;
  handleClick: () => void;
};

function DialogConfirmPublish({ isOpen, onClose, handleClick }: DialogConfirmPublishProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='border-purple-500/20 bg-zinc-950 text-white'>
        <DialogHeader className='space-y-2'>
          <DialogTitle>Publish post?</DialogTitle>
          <DialogDescription className='text-zinc-400'>
            Publishing will make this post live and you won't be able to undo this action.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='flex justify-between items-center sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClick}
            className='border-purple-500 text-purple-300 hover:bg-purple-500/10 w-1/2'
          >
            Publish
          </Button>
          <Button type='button' onClick={onClose} className='bg-purple-600 text-white hover:bg-purple-500 w-1/2'>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogConfirmPublish;
