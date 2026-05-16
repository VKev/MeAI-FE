import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { RootState } from '@/redux/store'
import type { TPostCheckSensitiveResponse, TPostMediaType } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { resourceApi } from '@/apis/resource.api'
import { feedKeys } from '@/hooks/use-feed'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type CreatePostDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MediaItem = {
  file: File
  previewUrl: string
  kind: 'image' | 'video'
}

type CreatePostFlowResult = {
  postId: string
  outcome: 'clean' | 'sensitive' | 'check-failed'
  sensitiveResult?: TPostCheckSensitiveResponse
}

const getMediaType = (items: MediaItem[]): TPostMediaType => {
  if (!items.length) return null
  const hasVideo = items.some((item) => item.kind === 'video')
  if (hasVideo) return 'Video'
  return 'Image'
}

const getResourceType = (item: MediaItem) => (item.kind === 'video' ? 'Video' : 'Image')

function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const queryClient = useQueryClient()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const displayName = currentUser?.username ?? 'meai-user'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()
  const [content, setContent] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaScrollRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const canSubmit = useMemo(() => content.trim().length > 0, [content])

  const resetState = () => {
    mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setMediaItems([])
    setContent('')
    setProgressPercent(0)
    setProgressLabel(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const trimmedContent = content.trim()
      if (!trimmedContent) {
        throw new Error('Missing content')
      }

      let resourceIds: string[] = []
      if (mediaItems.length) {
        const totalBytes = mediaItems.reduce((sum, item) => sum + (item.file.size || 0), 0)
        const loadedByIndex = new Array(mediaItems.length).fill(0)

        setProgressPercent(0)
        setProgressLabel('Uploading media...')

        const uploads = await Promise.all(
          mediaItems.map((item, index) =>
            resourceApi.uploadResource(item.file, {
              resourceType: getResourceType(item),
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
        resourceIds = uploads
          .map((item) => item?.resourceId ?? item?.id)
          .filter((value): value is string => Boolean(value))
      }

      setProgressPercent(88)
      setProgressLabel('Creating post...')
      const response = await feedApi.createPost({
        content: trimmedContent,
        resourceIds,
        mediaType: getMediaType(mediaItems)
      })

      setProgressPercent(94)
      setProgressLabel('Checking sensitive content...')
      try {
        const sensitiveResult = await feedApi.checkSensitivePost(response.id)

        if (sensitiveResult.isSensitive) {
          setProgressPercent(98)
          setProgressLabel('Sensitive content detected. Removing post...')
          await feedApi.deletePost(response.id)
          return {
            postId: response.id,
            outcome: 'sensitive',
            sensitiveResult
          } satisfies CreatePostFlowResult
        }

        setProgressPercent(100)
        return {
          postId: response.id,
          outcome: 'clean',
          sensitiveResult
        } satisfies CreatePostFlowResult
      } catch {
        setProgressPercent(98)
        setProgressLabel('Sensitive check failed. Removing post...')
        await feedApi.deletePost(response.id)
        return {
          postId: response.id,
          outcome: 'check-failed'
        } satisfies CreatePostFlowResult
      }
    },
    onSuccess: (result) => {
      if (result.outcome === 'sensitive') {
        toast.error('Sensitive content detected. The post was removed.')
        return
      }

      if (result.outcome === 'check-failed') {
        toast.error('Could not verify sensitive content. The post was removed.')
        return
      }

      toast.success('Post created')
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
      queryClient.refetchQueries({ queryKey: feedKeys.all, type: 'active' })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Could not create post')
    },
    onSettled: () => {
      setProgressPercent(0)
      setProgressLabel(null)
    }
  })

  const isBusy = createPostMutation.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (createPostMutation.isPending) return
    if (!nextOpen) {
      resetState()
    }
    onOpenChange(nextOpen)
  }

  const handleSelectMedia = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const nextItems: MediaItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      kind: file.type.startsWith('video/') ? 'video' : 'image'
    }))

    setMediaItems((current) => [...current, ...nextItems])
    event.target.value = ''
  }

  const handleRemoveMedia = (index: number) => {
    if (isBusy) return
    setMediaItems((current) => {
      const item = current[index]
      if (item) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const handleSubmit = () => {
    if (!canSubmit || isBusy) return
    createPostMutation.mutate()
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
          <DialogHeader className='items-center'>
            <DialogTitle>New post</DialogTitle>
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
                placeholder='What do you want to share?'
                className='w-full max-w-full resize-none whitespace-pre-wrap wrap-break-word'
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={isBusy}
              />
              {mediaItems.length ? (
                <div
                  ref={mediaScrollRef}
                  className='flex w-full max-w-full flex-nowrap items-start gap-3 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing'
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {mediaItems.map((item, index) => (
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
                          loading='lazy'
                          alt={item.file.name}
                          className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full'
                          draggable={false}
                        />
                      )}
                      <button
                        type='button'
                        className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background cursor-pointer'
                        onClick={() => handleRemoveMedia(index)}
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
          <div className='flex justify-end border-t mt-3 pt-3'>
            <Button className='w-fit' onClick={handleSubmit} disabled={!canSubmit || isBusy}>
              {createPostMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePostDialog
