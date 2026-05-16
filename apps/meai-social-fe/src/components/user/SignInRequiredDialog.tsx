import { useNavigate } from 'react-router'
import { PATH } from '@/routes/path'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

type SignInRequiredDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SignInRequiredDialog({ open, onOpenChange }: SignInRequiredDialogProps) {
  const navigate = useNavigate()

  const handleSignIn = () => {
    onOpenChange(false)
    navigate(PATH.LOGIN)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>Please sign in to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline' className='sm:w-1/2'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSignIn} className='sm:w-1/2'>
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SignInRequiredDialog
