import type { Post } from '@/models/post.model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Post | null;
  isLoading: boolean;
  onConfirm: (product: Post) => void;
}

export default function ProductScheduleConfirmDialog({ open, onOpenChange, product, isLoading, onConfirm }: Props) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md border border-white/15 bg-[#060912] text-white'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-400' />
            Cancel Scheduled Post
          </DialogTitle>
          <DialogDescription className='text-slate-400'>
            This post is scheduled. Confirm to cancel the schedule and move it back to Draft so you can edit it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='border-white/15 bg-white/5 text-white hover:bg-white/10'
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(product)}
            disabled={isLoading}
            className='bg-amber-500 text-white hover:bg-amber-400'
          >
            {isLoading ? 'Processing...' : 'Cancel Schedule & Edit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
