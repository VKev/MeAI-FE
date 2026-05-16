import { Flag, Heart, MessageCircle, Trash2 } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQueryClient,
  type InfiniteData,
  type UseQueryResult
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import type { TCommentResponse, TFeedCursor } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { feedKeys } from '@/hooks/use-feed'
import { formatRelativeTime } from '@/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { RootState } from '@/redux/store'
import { toast } from 'sonner'
import CommentDeleteDialog from '@/components/comment/CommentDeleteDialog'
import CommentContent from '@/components/comment/CommentContent'
import CommentReplyList from '@/components/comment/CommentReplyList'
import { getDisplayName, isSameUsername } from '@/components/comment/comment-utils'

type CommentItemProps = {
  comment: TCommentResponse
  isAuthed: boolean
  isPostOwner: boolean
  onRequireAuth: () => void
  onReportComment: (comment: TCommentResponse) => void
  onUserClick: (username: string) => void
  repliesLimit: number
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

const updateCommentInPages = (
  data: InfiniteData<TCommentResponse[]> | undefined,
  commentId: string,
  updater: (comment: TCommentResponse) => TCommentResponse
) => {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map((page) => page.map((item) => (item.id === commentId ? updater(item) : item)))
  }
}
type CommentQueryKey = ReturnType<typeof feedKeys.postComments> | ReturnType<typeof feedKeys.commentReplies>
type ToggleLikePayload = {
  commentId: string
  isLiked: boolean
  queryKey: CommentQueryKey
}

const CommentItem = memo(function CommentItem({
  comment,
  isAuthed,
  isPostOwner,
  onRequireAuth,
  onReportComment,
  onUserClick,
  repliesLimit
}: CommentItemProps) {
  const queryClient = useQueryClient()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const currentUsername = currentUser?.username ?? null
  const [isExpanded, setIsExpanded] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyTargetId, setReplyTargetId] = useState(comment.id)
  const [replyTargetName, setReplyTargetName] = useState<string>(() =>
    getDisplayName(comment.username, comment.userId, currentUsername)
  )
  const [deleteTarget, setDeleteTarget] = useState<TCommentResponse | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const commentQueryKey = feedKeys.postComments(comment.postId, repliesLimit)
  const replyQueryKey = feedKeys.commentReplies(comment.id, repliesLimit)

  useEffect(() => {
    setReplyTargetId(comment.id)
    setReplyTargetName(getDisplayName(comment.username, comment.userId, currentUsername))
    setReplyContent('')
  }, [comment.id, comment.userId, comment.username, currentUsername])

  const repliesQuery = useInfiniteQuery<
    TCommentResponse[],
    Error,
    InfiniteData<TCommentResponse[]>,
    ReturnType<typeof feedKeys.commentReplies>,
    TFeedCursor
  >({
    queryKey: replyQueryKey,
    enabled: isExpanded,
    initialPageParam: { limit: repliesLimit } as TFeedCursor,
    queryFn: ({ pageParam }) => feedApi.getCommentReplies(comment.id, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return undefined
      return getNextCursor(lastPage, repliesLimit)
    }
  })

  const replies = useMemo(() => repliesQuery.data?.pages.flat() ?? [], [repliesQuery.data])

  const baseRepliesByParent = useMemo<Map<string, TCommentResponse[]>>(() => {
    const map = new Map<string, TCommentResponse[]>()
    replies.forEach((reply) => {
      const parentId = reply.parentCommentId ?? comment.id
      const list = map.get(parentId)
      if (list) {
        list.push(reply)
      } else {
        map.set(parentId, [reply])
      }
    })
    return map
  }, [comment.id, replies])

  const rootReplies = baseRepliesByParent.get(comment.id) ?? []

  const replyTargets = useMemo<string[]>(
    () => rootReplies.filter((reply) => reply.repliesCount > 0).map((reply) => reply.id),
    [rootReplies]
  )

  const childRepliesQueries = useQueries({
    queries: replyTargets.map((replyId) => ({
      queryKey: feedKeys.commentReplies(replyId, repliesLimit),
      enabled: isExpanded,
      queryFn: () => feedApi.getCommentReplies(replyId, { limit: repliesLimit } as TFeedCursor)
    }))
  }) as UseQueryResult<TCommentResponse[], Error>[]

  const childRepliesByParent = useMemo<Map<string, TCommentResponse[]>>(() => {
    const map = new Map<string, TCommentResponse[]>()
    replyTargets.forEach((replyId, index) => {
      const data = childRepliesQueries[index]?.data ?? []
      if (data.length) {
        map.set(replyId, data)
      }
    })
    return map
  }, [childRepliesQueries, replyTargets])

  const repliesByParent = useMemo<Map<string, TCommentResponse[]>>(() => {
    const map = new Map<string, TCommentResponse[]>(baseRepliesByParent)

    childRepliesByParent.forEach((list, parentId) => {
      const existing = map.get(parentId)
      if (!existing) {
        map.set(parentId, [...list])
        return
      }
      const seen = new Set(existing.map((item) => item.id))
      list.forEach((item) => {
        if (!seen.has(item.id)) {
          existing.push(item)
          seen.add(item.id)
        }
      })
    })

    return map
  }, [baseRepliesByParent, childRepliesByParent])

  const displayName = useMemo(
    () => getDisplayName(comment.username, comment.userId, currentUsername),
    [comment.userId, comment.username, currentUsername]
  )
  const isOwner = useMemo(() => isSameUsername(comment.username, currentUsername), [comment.username, currentUsername])
  const canDeleteComment = isOwner || isPostOwner
  const canReportComment = !isOwner
  const avatarFallback = displayName.slice(0, 2).toUpperCase()
  const timeLabel = useMemo(() => formatRelativeTime(comment.createdAt), [comment.createdAt])
  const hasReplies = comment.repliesCount > 0
  const isLiked = Boolean(comment.isLikedByCurrentUser)
  const heartClass = isLiked ? 'h-4 w-4 text-rose-500 fill-rose-500' : 'h-4 w-4'

  const toggleLikeMutation = useMutation({
    mutationFn: ({ commentId, isLiked }: ToggleLikePayload) =>
      isLiked ? feedApi.unlikeComment(commentId) : feedApi.likeComment(commentId),
    onMutate: async ({ commentId, isLiked, queryKey }: ToggleLikePayload) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<InfiniteData<TCommentResponse[]>>(queryKey)

      queryClient.setQueryData<InfiniteData<TCommentResponse[]>>(queryKey, (current) =>
        updateCommentInPages(current, commentId, (item) => ({
          ...item,
          isLikedByCurrentUser: !isLiked,
          likesCount: Math.max(0, item.likesCount + (isLiked ? -1 : 1))
        }))
      )

      return { previous, queryKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<InfiniteData<TCommentResponse[]>>(variables.queryKey, (current) =>
        updateCommentInPages(current, variables.commentId, (item) => ({
          ...item,
          isLikedByCurrentUser: data.isLikedByCurrentUser,
          likesCount: data.likesCount
        }))
      )
    }
  })

  const replyMutation = useMutation({
    mutationFn: async () => {
      const trimmed = replyContent.trim()
      if (!trimmed) {
        throw new Error('Missing reply')
      }
      return feedApi.createReply(replyTargetId, { content: trimmed })
    },
    onSuccess: () => {
      toast.success('Reply posted')
      setReplyContent('')
      setReplyTargetId(comment.id)
      setReplyTargetName(getDisplayName(comment.username, comment.userId, currentUsername))
      queryClient.invalidateQueries({ queryKey: feedKeys.commentReplies(comment.id, repliesLimit) })
      if (replyTargetId !== comment.id) {
        queryClient.invalidateQueries({ queryKey: feedKeys.commentReplies(replyTargetId, repliesLimit) })
      }
      queryClient.invalidateQueries({ queryKey: feedKeys.postComments(comment.postId, repliesLimit) })
      setIsExpanded(true)
    },
    onError: () => {
      toast.error('Could not reply')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return feedApi.deleteComment(commentId)
    },
    onSuccess: () => {
      toast.success('Comment deleted')
      setIsDeleteOpen(false)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: feedKeys.postComments(comment.postId, repliesLimit) })
      queryClient.invalidateQueries({ queryKey: feedKeys.commentReplies(comment.id, repliesLimit) })
    },
    onError: () => {
      toast.error('Could not delete comment')
    }
  })

  const isCommentLikeBusy = toggleLikeMutation.isPending && toggleLikeMutation.variables?.commentId === comment.id
  const likeBusyId = toggleLikeMutation.isPending ? (toggleLikeMutation.variables?.commentId ?? null) : null

  const focusReplyInput = () => {
    requestAnimationFrame(() => replyInputRef.current?.focus())
  }

  const handleUserClick = () => {
    if (!comment.username) return
    onUserClick(comment.username)
  }

  const handleReplyTo = (target: TCommentResponse) => {
    if (!isAuthed) {
      onRequireAuth()
      return
    }
    setReplyTargetId(target.id)
    setReplyTargetName(getDisplayName(target.username, target.userId, currentUsername))
    setIsExpanded(true)
    focusReplyInput()
  }

  const handleLikeComment = () => {
    if (!isAuthed) {
      onRequireAuth()
      return
    }
    toggleLikeMutation.mutate({
      commentId: comment.id,
      isLiked: isLiked,
      queryKey: commentQueryKey
    })
  }

  const handleLikeReply = (reply: TCommentResponse) => {
    if (!isAuthed) {
      onRequireAuth()
      return
    }
    toggleLikeMutation.mutate({
      commentId: reply.id,
      isLiked: Boolean(reply.isLikedByCurrentUser),
      queryKey: replyQueryKey
    })
  }

  const handleDelete = (target: TCommentResponse) => {
    if (!isAuthed) {
      onRequireAuth()
      return
    }
    setDeleteTarget(target)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || deleteMutation.isPending) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    if (deleteMutation.isPending) return
    setIsDeleteOpen(nextOpen)
    if (!nextOpen) {
      setDeleteTarget(null)
    }
  }

  const handleSubmitReply = () => {
    if (!isAuthed) {
      onRequireAuth()
      return
    }
    if (replyMutation.isPending) return
    if (!replyContent.trim()) return
    replyMutation.mutate()
  }

  useEffect(() => {
    if (!isExpanded || !repliesQuery.hasNextPage) return
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (repliesQuery.isFetchingNextPage) return
        repliesQuery.fetchNextPage()
      },
      { rootMargin: '200px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isExpanded, repliesQuery.fetchNextPage, repliesQuery.hasNextPage, repliesQuery.isFetchingNextPage])

  return (
    <>
      <div className='rounded-xl border border-border bg-card p-4'>
        <div className='flex gap-3'>
          <Avatar className='h-8 w-8 cursor-pointer' onClick={handleUserClick}>
            {comment.avatarUrl ? <AvatarImage src={comment.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className='flex-1 space-y-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex flex-col text-xs text-foreground'>
                <span className='font-semibold break-all cursor-pointer' onClick={handleUserClick}>
                  {displayName}
                </span>
                {timeLabel ? <span className='text-[11px] font-normal text-muted-foreground'>{timeLabel}</span> : null}
              </div>
              {isAuthed ? (
                <div className='flex items-center gap-1'>
                  {canDeleteComment ? (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Delete comment'
                      onClick={() => handleDelete(comment)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  ) : null}
                  {canReportComment ? (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Report comment'
                      onClick={() => onReportComment(comment)}
                    >
                      <Flag className='h-4 w-4' />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <CommentContent content={comment.content} />
            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
              <button
                type='button'
                className='flex items-center gap-1 hover:text-foreground'
                onClick={handleLikeComment}
                disabled={isCommentLikeBusy}
              >
                <Heart className={heartClass} />
                {comment.likesCount}
              </button>
              <button
                type='button'
                className='flex items-center gap-1 hover:text-foreground'
                onClick={() => handleReplyTo(comment)}
              >
                <MessageCircle className='h-4 w-4' />
                {comment.repliesCount}
              </button>
            </div>

            {hasReplies ? (
              <button
                type='button'
                className='text-xs font-semibold text-muted-foreground hover:text-foreground'
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? 'Hide replies' : `View replies (${comment.repliesCount})`}
              </button>
            ) : null}

            {isExpanded ? (
              <div className='space-y-3 border-l border-border pl-4'>
                {repliesQuery.isLoading ? (
                  <div className='text-xs text-muted-foreground'>Loading replies...</div>
                ) : repliesQuery.isError ? (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>Failed to load replies.</span>
                    <Button variant='outline' size='xs' onClick={() => repliesQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : rootReplies.length === 0 ? (
                  <div className='text-xs text-muted-foreground'>No replies yet.</div>
                ) : (
                  <CommentReplyList
                    rootReplies={rootReplies}
                    repliesByParent={repliesByParent}
                    isAuthed={isAuthed}
                    currentUsername={currentUsername}
                    isPostOwner={isPostOwner}
                    isSameUsername={isSameUsername}
                    onReportComment={onReportComment}
                    onRequireAuth={onRequireAuth}
                    onUserClick={onUserClick}
                    onToggleLike={handleLikeReply}
                    onReplyTo={handleReplyTo}
                    onDelete={handleDelete}
                    likeBusyId={likeBusyId}
                    isDeleteBusy={deleteMutation.isPending}
                  />
                )}

                {repliesQuery.hasNextPage ? <div ref={loadMoreRef} className='h-1 w-full' /> : null}
                {repliesQuery.isFetchingNextPage ? (
                  <div className='text-xs text-muted-foreground'>Loading more replies...</div>
                ) : null}
              </div>
            ) : null}

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>Replying to {replyTargetName}</span>
              </div>
              <Textarea
                ref={replyInputRef}
                rows={2}
                placeholder={isAuthed ? 'Write a reply...' : 'Sign in to reply'}
                className='w-full max-w-full resize-none whitespace-pre-wrap wrap-break-word'
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                disabled={!isAuthed || replyMutation.isPending}
              />
              <div className='flex justify-end'>
                <Button
                  size='sm'
                  onClick={handleSubmitReply}
                  disabled={!isAuthed || !replyContent.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommentDeleteDialog
        open={isDeleteOpen}
        title={deleteTarget?.parentCommentId ? 'Delete reply' : 'Delete comment'}
        description='This action cannot be undone. The selected comment and its replies will be removed.'
        isBusy={deleteMutation.isPending}
        onOpenChange={handleDeleteOpenChange}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
})

CommentItem.displayName = 'CommentItem'

export default CommentItem
