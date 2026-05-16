import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  TPostCheckSensitiveResponse,
  TPostMediaType,
  TPostResponse,
  TUpdatePostPayload
} from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { resourceApi } from '@/apis/resource.api'
import { feedKeys } from '@/hooks/use-feed'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { RootState } from '@/redux/store'
import { useSelector } from 'react-redux'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type EditPostDialogProps = {
  open: boolean
  post: TPostResponse | null
  onOpenChange: (open: boolean) => void
}

type ExistingMediaItem = {
  resourceId: string
  url: string
  contentType: string | null
  resourceType: string | null
}

type NewMediaItem = {
  file: File
  previewUrl: string
  kind: 'image' | 'video'
}

type UpdatePostFlowResult = {
  outcome: 'clean' | 'sensitive' | 'check-failed'
  sensitiveResult?: TPostCheckSensitiveResponse
}

const toPostMediaType = (mediaType: string | null): TPostMediaType => {
  if (mediaType === 'Image' || mediaType === 'Video') return mediaType
  return null
}

const buildRollbackPayload = (source: TPostResponse): TUpdatePostPayload => ({
  content: source.content,
  resourceIds: (source.media ?? []).map((item) => item.resourceId),
  mediaType: toPostMediaType(source.mediaType)
})

const isVideoMedia = (item: { contentType: string | null; resourceType: string | null }) =>
  Boolean(item.contentType?.startsWith('video/') || item.resourceType === 'Video')

const getMediaType = (existing: ExistingMediaItem[], added: NewMediaItem[]): TPostMediaType => {
  const total = existing.length + added.length
  if (!total) return null
  const hasVideo = existing.some(isVideoMedia) || added.some((item) => item.kind === 'video')
  return hasVideo ? 'Video' : 'Image'
}

function EditPostDialog({ open, post, onOpenChange }: EditPostDialogProps) {
  const queryClient = useQueryClient()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const displayName = currentUser?.username ?? 'meai-user'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()
  const [content, setContent] = useState('')
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([])
  const [removedResourceIds, setRemovedResourceIds] = useState<string[]>([])
  const [newMedia, setNewMedia] = useState<NewMediaItem[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaScrollRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const originalPostPayloadRef = useRef<TUpdatePostPayload | null>(null)

  const resetState = () => {
    newMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setNewMedia([])
    setRemovedResourceIds([])
    setExistingMedia([])
    setContent('')
    setProgressPercent(0)
    setProgressLabel(null)
    originalPostPayloadRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (open && post) {
      setContent(post.content ?? '')
      setExistingMedia(
        (post.media ?? []).map((item) => ({
          resourceId: item.resourceId,
          url: item.presignedUrl,
          contentType: item.contentType,
          resourceType: item.resourceType
        }))
      )
      setRemovedResourceIds([])
      newMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setNewMedia([])
      setProgressPercent(0)
      setProgressLabel(null)
      originalPostPayloadRef.current = buildRollbackPayload(post)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (!open) {
      resetState()
    }
  }, [open, post])

  const visibleExisting = useMemo(
    () => existingMedia.filter((item) => !removedResourceIds.includes(item.resourceId)),
    [existingMedia, removedResourceIds]
  )
  const totalMediaCount = visibleExisting.length + newMedia.length

  const canSubmit = useMemo(() => content.trim().length > 0 || totalMediaCount > 0, [content, totalMediaCount])
  const isDirty = useMemo(() => {
    return (post?.content ?? '') !== content || removedResourceIds.length > 0 || newMedia.length > 0
  }, [content, newMedia.length, post?.content, removedResourceIds.length])

  const updatePostMutation = useMutation({
    mutationFn: async () => {
      if (!post) {
        throw new Error('Missing post')
      }
      const trimmedContent = content.trim()
      const keptResourceIds = visibleExisting.map((item) => item.resourceId)
      const totalBytes = newMedia.reduce((sum, item) => sum + (item.file.size || 0), 0)
      const loadedByIndex = new Array(newMedia.length).fill(0)

      let newResourceIds: string[] = []

      if (newMedia.length) {
        setProgressPercent(0)
        setProgressLabel('Uploading media...')

        const uploads = await Promise.all(
          newMedia.map((item, index) =>
            resourceApi.uploadResource(item.file, {
              resourceType: item.kind === 'video' ? 'Video' : 'Image',
              onUploadProgress: (event) => {
                const loaded = event.loaded ?? 0
                loadedByIndex[index] = loaded
                const totalLoaded = loadedByIndex.reduce((sum, value) => sum + value, 0)
                const percent = totalBytes ? Math.round((totalLoaded / totalBytes) * 90) : 90
                setProgressPercent(Math.min(90, percent))
              }
            })
          )
        )

        newResourceIds = uploads
          .map((item) => item?.resourceId ?? item?.id)
          .filter((value): value is string => Boolean(value))
      }

      const resourceIds = [...keptResourceIds, ...newResourceIds]
      if (!trimmedContent && resourceIds.length === 0) {
        throw new Error('Missing content')
      }

      setProgressPercent(newMedia.length ? 95 : 90)
      setProgressLabel('Updating post...')

      const response = await feedApi.updatePost(post.id, {
        content: trimmedContent || null,
        resourceIds,
        mediaType: getMediaType(visibleExisting, newMedia)
      })

      setProgressPercent(94)
      setProgressLabel('Checking sensitive content...')

      try {
        const sensitiveResult = await feedApi.checkSensitivePost(response.id)

        if (sensitiveResult.isSensitive) {
          setProgressPercent(98)
          setProgressLabel('Sensitive content detected. Restoring previous version...')
          await feedApi.updatePost(response.id, originalPostPayloadRef.current ?? buildRollbackPayload(post))
          return { outcome: 'sensitive', sensitiveResult } satisfies UpdatePostFlowResult
        }

        setProgressPercent(100)
        return {
          outcome: 'clean',
          sensitiveResult
        } satisfies UpdatePostFlowResult
      } catch {
        setProgressPercent(98)
        setProgressLabel('Sensitive content detected. Restoring previous version...')
        await feedApi.updatePost(response.id, originalPostPayloadRef.current ?? buildRollbackPayload(post))
        return { outcome: 'sensitive' } satisfies UpdatePostFlowResult
      }
    },
    onSuccess: (result) => {
      if (result.outcome === 'clean') {
        toast.success('Post updated')
        queryClient.invalidateQueries({ queryKey: feedKeys.all })
        onOpenChange(false)
        return
      }

      if (result.outcome === 'sensitive') {
        toast.error('Sensitive content detected. Changes were reverted.')
        queryClient.invalidateQueries({ queryKey: feedKeys.all })
        return
      }

      toast.error('Could not verify sensitive content. Changes were reverted.')
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
    onError: () => {
      toast.error('Could not update post')
    },
    onSettled: () => {
      setProgressPercent(0)
      setProgressLabel(null)
    }
  })

  const isBusy = updatePostMutation.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = () => {
    if (!canSubmit || !isDirty || isBusy) return
    updatePostMutation.mutate()
  }

  const handleSelectMedia = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const nextItems: NewMediaItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      kind: file.type.startsWith('video/') ? 'video' : 'image'
    }))

    setNewMedia((current) => [...current, ...nextItems])
    event.target.value = ''
  }

  const handleRemoveExisting = (resourceId: string) => {
    if (isBusy) return
    setRemovedResourceIds((current) => (current.includes(resourceId) ? current : [...current, resourceId]))
  }

  const handleRemoveNew = (index: number) => {
    if (isBusy) return
    setNewMedia((current) => {
      const item = current[index]
      if (item) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button')) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const container = mediaScrollRef.current
    if (!container) return
    isDraggingRef.current = true
    dragStartXRef.current = event.clientX
    scrollLeftRef.current = container.scrollLeft
    container.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    const container = mediaScrollRef.current
    if (!container) return
    const delta = event.clientX - dragStartXRef.current
    container.scrollLeft = scrollLeftRef.current - delta
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    mediaScrollRef.current?.releasePointerCapture?.(event.pointerId)
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
        <div className='relative'>
          {isBusy ? (
            <div className='absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
              <div className='w-[min(90%,20rem)] space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm'>
                <div className='text-sm font-semibold text-foreground'>{progressLabel ?? 'Processing...'}</div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div className='h-full bg-primary transition-[width]' style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          ) : null}
          <DialogHeader className='items-center py-3'>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <div className='flex gap-4'>
            <div className='flex flex-col items-center'>
              <Avatar>
                {currentUser?.avatarPresignedUrl ? (
                  <AvatarImage src={currentUser.avatarPresignedUrl} alt={displayName} />
                ) : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className='mt-3 flex-1 w-px bg-border' />
            </div>

            <div className='flex-1 min-w-0 space-y-3'>
              <div className='text-sm font-semibold text-foreground'>{displayName}</div>
              <Textarea
                placeholder='Update your post'
                className='w-full max-w-full resize-none whitespace-pre-wrap wrap-break-word'
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={isBusy}
              />
              {visibleExisting.length || newMedia.length ? (
                <div
                  ref={mediaScrollRef}
                  className='flex w-full max-w-full flex-nowrap items-start gap-3 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing'
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {visibleExisting.map((item) => (
                    <div key={item.resourceId} className='relative shrink-0 overflow-hidden rounded-lg border'>
                      {isVideoMedia(item) ? (
                        <video src={item.url} className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full' controls />
                      ) : (
                        <img
                          src={item.url}
                          loading='lazy'
                          alt='Post media'
                          className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full'
                        />
                      )}
                      <button
                        type='button'
                        className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background cursor-pointer'
                        onClick={() => handleRemoveExisting(item.resourceId)}
                        onPointerDown={(event) => event.stopPropagation()}
                        aria-label='Remove media'
                        disabled={isBusy}
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  ))}
                  {newMedia.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className='relative shrink-0 overflow-hidden rounded-lg border'
                    >
                      {item.kind === 'video' ? (
                        <video
                          src={item.previewUrl}
                          className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full'
                          controls
                        />
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full'
                        />
                      )}
                      <button
                        type='button'
                        className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background cursor-pointer'
                        onClick={() => handleRemoveNew(index)}
                        onPointerDown={(event) => event.stopPropagation()}
                        aria-label='Remove media'
                        disabled={isBusy}
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*,video/*'
                  multiple
                  className='hidden'
                  onChange={handleSelectMedia}
                  disabled={isBusy}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='icon-lg'
                  className='text-muted-foreground'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <ImagePlus className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </div>
          <div className='flex justify-end gap-2 border-t mt-3 pt-3'>
            <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || !isDirty || isBusy}>
              {isBusy ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditPostDialog
