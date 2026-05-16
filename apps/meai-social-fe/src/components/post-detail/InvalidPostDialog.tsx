import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { ArrowLeft } from 'lucide-react'
import React from 'react'

function InvalidPostDialog({
  isInvalid,
  handleInvalidOpenChange,
  handleInvalidClose
}: {
  isInvalid: boolean
  handleInvalidOpenChange: (open: boolean) => void
  handleInvalidClose: () => void
}) {
  return (
    <AlertDialog open={isInvalid} onOpenChange={handleInvalidOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ArrowLeft className='h-5 w-5 text-foreground' />
          </AlertDialogMedia>
          <AlertDialogTitle>Invalid page</AlertDialogTitle>
          <AlertDialogDescription>
            This post does not match the username in the URL. Please return to the homepage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleInvalidClose}>Back to home</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default React.memo(InvalidPostDialog)
