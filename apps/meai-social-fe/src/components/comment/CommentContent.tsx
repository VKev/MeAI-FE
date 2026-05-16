import { memo, useEffect, useRef, useState } from 'react'

type CommentContentProps = {
  content: string
  maxLines?: number
}

const CommentContent = memo(({ content, maxLines = 4 }: CommentContentProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)

  useEffect(() => {
    if (isExpanded) return
    const element = contentRef.current
    if (!element) return

    const frame = requestAnimationFrame(() => {
      const hasOverflow = element.scrollHeight > element.clientHeight + 1
      setCanExpand(hasOverflow)
    })

    return () => cancelAnimationFrame(frame)
  }, [content, isExpanded, maxLines])

  const clampStyle = isExpanded
    ? undefined
    : ({
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      } as const)

  return (
    <div className='space-y-2'>
      <div
        ref={contentRef}
        className='w-full max-w-full whitespace-pre-wrap wrap-break-word text-sm text-foreground'
        style={clampStyle}
      >
        {content}
      </div>
      {canExpand ? (
        <button
          type='button'
          className='text-xs font-semibold text-foreground hover:underline'
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
})

CommentContent.displayName = 'CommentContent'

export default CommentContent
