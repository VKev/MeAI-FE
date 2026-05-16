import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TPostResponse } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type ReportPostDialogProps = {
  open: boolean
  post: TPostResponse | null
  onOpenChange: (open: boolean) => void
}

function ReportPostDialog({ open, post, onOpenChange }: ReportPostDialogProps) {
  const [reason, setReason] = useState('')

  const canSubmit = useMemo(() => reason.trim().length > 0, [reason])

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!post) {
        throw new Error('Missing post')
      }
      const trimmed = reason.trim()
      if (!trimmed) {
        throw new Error('Missing reason')
      }
      return feedApi.reportTarget({ targetType: 'Post', targetId: post.id, reason: trimmed })
    },
    onSuccess: () => {
      toast.success('Report submitted')
      setReason('')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Could not submit report')
    }
  })

  const isBusy = reportMutation.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return
    if (!nextOpen) {
      setReason('')
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = () => {
    if (!canSubmit || isBusy) return
    reportMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='w-[96vw] sm:max-w-xl max-h-[90vh] sm:max-h-[95vh] overflow-y-auto'
        showCloseButton={!isBusy}
        onInteractOutside={(event) => {
          if (isBusy) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault()
        }}
      >
        <DialogHeader className='items-center'>
          <DialogTitle>Report post</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <Textarea
            placeholder='Tell us what happened'
            className='w-full max-w-full resize-none whitespace-pre-wrap wrap-break-word'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isBusy}
          />
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isBusy}>
              {isBusy ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Submit report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReportPostDialog
