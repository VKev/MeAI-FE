import React, { useEffect, useMemo, useRef, useState } from 'react'

type PostContentProps = {
  content: string
  maxLines?: number
}

type ContentPart = { type: 'text'; value: string } | { type: 'tag'; value: string }

const PostContent = React.memo(({ content, maxLines = 4 }: PostContentProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)

  const parts = useMemo<ContentPart[]>(() => {
    const result: ContentPart[] = []
    const regex = /#[\p{L}0-9_]+/gu
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content))) {
      const start = match.index
      if (start > lastIndex) {
        result.push({ type: 'text', value: content.slice(lastIndex, start) })
      }
      result.push({ type: 'tag', value: match[0] })
      lastIndex = start + match[0].length
    }

    if (lastIndex < content.length) {
      result.push({ type: 'text', value: content.slice(lastIndex) })
    }

    return result
  }, [content])

  const nodes = useMemo(() => {
    const output: React.ReactNode[] = []
    let isLineBreak = true

    parts.forEach((part, index) => {
      if (part.type === 'text') {
        if (part.value) {
          output.push(part.value)
          isLineBreak = part.value.endsWith('\n')
        }
        return
      }

      if (!isLineBreak) {
        output.push(<br key={`br-before-${index}`} />)
      }

      output.push(
        <strong key={`tag-${index}`} className='font-semibold text-foreground'>
          {part.value}
        </strong>
      )

      const next = parts[index + 1]
      if (next && next.type === 'text' && next.value.trim().length > 0 && !next.value.startsWith('\n')) {
        output.push(<br key={`br-after-${index}`} />)
        isLineBreak = true
      } else {
        isLineBreak = false
      }
    })

    return output
  }, [parts])

  useEffect(() => {
    if (isExpanded) {
      return
    }

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
        {nodes}
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

export default PostContent
