import { useEffect, useMemo, useRef } from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import type { TFeedCursor, TCommentResponse } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { feedKeys } from '@/hooks/use-feed'
import CommentItem from '@/components/comment/CommentItem'
import CommentListSkeleton from '@/components/comment/CommentListSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CommentListProps = {
  postId: string
  limit?: number
  isAuthed: boolean
  isPostOwner: boolean
  onRequireAuth: () => void
  onReportComment: (comment: TCommentResponse) => void
  onUserClick: (username: string) => void
}

const getNextCursor = (items: TCommentResponse[], limit: number): TFeedCursor | undefined => {
  const last = items[items.length - 1]
  if (!last?.createdAt || !last?.id) return undefined

  return {
    cursorCreatedAt: last.createdAt,
    cursorId: last.id,
    limit
  }
}

function CommentList({
  postId,
  limit = 10,
  isAuthed,
  isPostOwner,
  onRequireAuth,
  onReportComment,
  onUserClick
}: CommentListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const commentsQuery = useInfiniteQuery<
    TCommentResponse[],
    Error,
    InfiniteData<TCommentResponse[]>,
    ReturnType<typeof feedKeys.postComments>,
    TFeedCursor
  >({
    queryKey: feedKeys.postComments(postId, limit),
    enabled: Boolean(postId),
    initialPageParam: { limit } as TFeedCursor,
    queryFn: ({ pageParam }) => feedApi.getPostComments(postId, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextCursor(lastPage, limit)
    }
  })

  const comments = useMemo(() => commentsQuery.data?.pages.flat() ?? [], [commentsQuery.data])

  useEffect(() => {
    if (!commentsQuery.hasNextPage) return
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (commentsQuery.isFetchingNextPage) return
        commentsQuery.fetchNextPage()
      },
      { rootMargin: '240px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [commentsQuery.fetchNextPage, commentsQuery.hasNextPage, commentsQuery.isFetchingNextPage])

  if (commentsQuery.isLoading) {
    return <CommentListSkeleton />
  }

  if (commentsQuery.isError) {
    return (
      <Card className='border-border bg-card'>
        <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
          <div>Something went wrong while loading comments.</div>
          <Button variant='outline' size='sm' onClick={() => commentsQuery.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {comments.length === 0 ? (
        <Card className='border-border bg-card'>
          <CardContent className='text-sm text-muted-foreground'>No comments yet.</CardContent>
        </Card>
      ) : (
        <div className='flex flex-col gap-4'>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthed={isAuthed}
              isPostOwner={isPostOwner}
              onRequireAuth={onRequireAuth}
              onReportComment={onReportComment}
              onUserClick={onUserClick}
              repliesLimit={limit}
            />
          ))}
        </div>
      )}

      {commentsQuery.hasNextPage ? <div ref={loadMoreRef} className='h-1 w-full' /> : null}
      {commentsQuery.isFetchingNextPage ? (
        <div className='text-xs text-center text-muted-foreground'>Loading more comments...</div>
      ) : null}
    </div>
  )
}

export default CommentList
