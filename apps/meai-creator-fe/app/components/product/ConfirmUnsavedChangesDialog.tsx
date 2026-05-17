import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ConfirmUnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmUnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmUnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='border border-white/10 bg-[#060912] text-white'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-xl'>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className='text-slate-400'>
            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            disabled={isLoading}
            className='border-white/10 bg-white/4 text-white/85 hover:bg-white/8 hover:text-white'
          >
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white'
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
