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

function DialogError({ isOpen }: { isOpen: boolean }) {
  return (
    <Dialog open={isOpen} onOpenChange={() => (window.location.href = '/')}>
      <DialogContent>
        <DialogHeader className='space-y-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/20 text-amber-600'>
            <AlertTriangle className='h-5 w-5' />
          </div>
          <div className='space-y-1'>
            <DialogTitle className='text-xl font-semibold tracking-tight'>Something went wrong</DialogTitle>
            <DialogDescription className='text-sm text-text-secondary'>
              We could not load this page. Please try again later.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className='w-full'>
          <Button
            type='button'
            onClick={() => {
              window.location.href = '/';
            }}
            className='w-full rounded-lg bg-primary text-white shadow-lg shadow-violet-500/30 sm:w-auto'
          >
            Return to Home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogError;
