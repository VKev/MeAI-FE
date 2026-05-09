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
import { GlobeLock, Trash2 } from 'lucide-react';

interface ProductDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Post | null;
  isLoading: boolean;
  onConfirm: (product: Post) => void;
}

export default function ProductDeleteConfirmDialog({
  open,
  onOpenChange,
  product,
  isLoading,
  onConfirm
}: ProductDeleteConfirmDialogProps) {
  if (!product) return null;

  const isPublished = product.status === 'published';
  const title = isPublished ? 'Unpublish Product' : 'Delete Product';
  const actionText = isPublished ? 'Unpublish' : 'Delete';
  const description = isPublished
    ? 'This post is published. Confirm to unpublish it from connected platforms.'
    : 'This action cannot be undone. Please confirm before deleting this product.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md border border-white/15 bg-[#060912] text-white'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='text-slate-400'>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='border-white/15 bg-white/5 text-white hover:bg-white/10'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={() => onConfirm(product)}
            disabled={isLoading}
            className='bg-rose-600 text-white hover:bg-rose-500'
          >
            {isLoading ? 'Processing...' : actionText}
            {isPublished ? <GlobeLock className='ml-2 h-4 w-4' /> : <Trash2 className='ml-2 h-4 w-4' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
