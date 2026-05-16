import { Loader2, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TPostResponse } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { feedKeys } from '@/hooks/use-feed'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

type DeletePostDialogProps = {
  open: boolean
  post: TPostResponse | null
  onOpenChange: (open: boolean) => void
}

function DeletePostDialog({ open, post, onOpenChange }: DeletePostDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!post) {
        throw new Error('Missing post')
      }
      return feedApi.deletePost(post.id)
    },
    onSuccess: () => {
      toast.success('Post deleted')
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Could not delete post')
    }
  })

  const isBusy = deleteMutation.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return
    onOpenChange(nextOpen)
  }

  const handleConfirm = () => {
    if (!post || isBusy) return
    deleteMutation.mutate()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className='h-5 w-5 text-red-600' />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete post</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your post will be removed from the feed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={handleConfirm} disabled={isBusy}>
            {isBusy ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeletePostDialog
