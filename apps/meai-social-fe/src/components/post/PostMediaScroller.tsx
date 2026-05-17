import React, { useCallback, useRef } from 'react'

export type PostMediaItem = {
  url: string
  contentType: string | null
  resourceType: string | null
}

type PostMediaScrollerProps = {
  items: PostMediaItem[]
  fallbackType: string | null
  onOpenMedia: (items: PostMediaItem[], index: number, fallbackType: string | null) => void
}

const PostMediaScroller = React.memo(({ items, fallbackType, onOpenMedia }: PostMediaScrollerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, moved: false })

  const isVideo = useCallback(
    (item: PostMediaItem) => {
      if (item.contentType?.startsWith('video/')) return true
      if (item.resourceType === 'Video') return true
      if (fallbackType === 'Video') return true
      return false
    },
    [fallbackType]
  )

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const container = containerRef.current
    if (!container) return
    dragState.current.isDragging = true
    dragState.current.startX = event.clientX
    dragState.current.startScrollLeft = container.scrollLeft
    dragState.current.moved = false
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.isDragging) return
    const container = containerRef.current
    if (!container) return
    const delta = event.clientX - dragState.current.startX
    if (Math.abs(delta) > 4) {
      dragState.current.moved = true
    }
    container.scrollLeft = dragState.current.startScrollLeft - delta
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!dragState.current.isDragging) return
    dragState.current.isDragging = false
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      event.stopPropagation()
      dragState.current.moved = false
    }
  }, [])

  const handleItemClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, index: number) => {
      event.stopPropagation()
      if (dragState.current.moved) {
        dragState.current.moved = false
        return
      }
      onOpenMedia(items, index, fallbackType)
    },
    [fallbackType, items, onOpenMedia]
  )

  return (
    <div
      ref={containerRef}
      className='flex w-full max-w-full flex-nowrap items-start gap-3 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing'
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      {items.map((item, index) => (
        <div
          key={item.url}
          className='relative shrink-0 overflow-hidden rounded-lg border cursor-pointer max-w-[80vw] sm:max-w-full'
          onClick={(event) => handleItemClick(event, index)}
        >
          {isVideo(item) ? (
            <video src={item.url} className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full' controls />
          ) : (
            <img
              src={item.url}
              alt='Post media'
              className='h-auto max-h-48 sm:max-h-64 w-auto max-w-full'
              draggable={false}
              loading='lazy'
            />
          )}
        </div>
      ))}
    </div>
  )
})

export default PostMediaScroller
