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
import { useNavigate } from 'react-router';

function DialogError({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate();
  return (
    <Dialog open={isOpen}>
      <DialogContent className='border border-amber-500/20 bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.7),rgba(9,9,11,1))] text-white shadow-[0_24px_80px_-40px_rgba(251,191,36,0.6)]'>
        <DialogHeader className='space-y-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300'>
            <AlertTriangle className='h-5 w-5' />
          </div>
          <div className='space-y-1'>
            <DialogTitle className='text-xl font-semibold tracking-tight'>Something went wrong</DialogTitle>
            <DialogDescription className='text-slate-300/80'>
              We could not load this page. Please try again later.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className='w-full'>
          <Button
            type='button'
            onClick={() => {
              navigate('/');
            }}
            className='w-full rounded-lg bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 sm:w-auto'
          >
            Return to Home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogError;
