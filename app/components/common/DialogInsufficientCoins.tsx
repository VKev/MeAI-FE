import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router';
import CoinIcon from '@/components/icons/CoinIcon';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // Best-effort numbers for the copy — may be undefined when we never got a quote back.
  requiredCoins?: number;
  currentBalance?: number;
  message?: string;
};

export default function DialogInsufficientCoins({ isOpen, onClose, requiredCoins, currentBalance, message }: Props) {
  const navigate = useNavigate();
  const short =
    typeof requiredCoins === 'number' && typeof currentBalance === 'number'
      ? Math.max(0, requiredCoins - currentBalance)
      : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CoinIcon />
            Not enough MeAI coins
          </DialogTitle>
          <DialogDescription className='text-zinc-400'>
            {message || 'This action costs more coins than your current balance.'}
          </DialogDescription>
        </DialogHeader>

        {typeof requiredCoins === 'number' && (
          <div className='space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm'>
            <div className='flex justify-between text-zinc-300'>
              <span>Required</span>
              <span className='font-semibold text-white'>{requiredCoins} coins</span>
            </div>
            {typeof currentBalance === 'number' && (
              <div className='flex justify-between text-rose-300'>
                <span>Your balance</span>
                <span className='font-semibold'>{currentBalance} coins</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button
            className='bg-purple-600 text-white hover:bg-purple-700'
            variant={'default'}
            onClick={() => {
              onClose();
              navigate('/user/plans');
            }}
          >
            Buy coins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
