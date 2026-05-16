import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import type { TCommentResponse, TPostResponse } from '@/models/feed.model'
import { feedApi } from '@/apis/feed.api'
import { feedKeys } from '@/hooks/use-feed'
import { PATH } from '@/routes/path'
import PostDetailCard from '@/components/post-detail/PostDetailCard'
import ReportCommentDialog from '@/components/post-detail/ReportCommentDialog'
import PostDetailSkeleton from '@/components/post-detail/PostDetailSkeleton'
import CommentList from '@/components/comment/CommentList'
import CommentListSkeleton from '@/components/comment/CommentListSkeleton'
import DeletePostDialog from '@/components/post/DeletePostDialog'
import EditPostDialog from '@/components/post/EditPostDialog'
import PostMediaViewerDialog from '@/components/post/PostMediaViewerDialog'
import ReportPostDialog from '@/components/post/ReportPostDialog'
import SignInRequiredDialog from '@/components/user/SignInRequiredDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { PostMediaItem } from '@/components/post/PostMediaScroller'
import { toast } from 'sonner'
import InvalidPostDialog from '@/components/post-detail/InvalidPostDialog'

const COMMENT_LIMIT = 10

type MediaViewerState = {
  open: boolean
  items: PostMediaItem[]
  index: number
  fallbackType: string | null
}

function PostDetail() {
  const navigate = useNavigate()
  const params = useParams()
  const postId = params.postId ?? ''
  const paramUsername = useMemo(() => (params.username ?? '').replace(/^@/, ''), [params.username])
  const queryClient = useQueryClient()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const isAuthed = Boolean(currentUser)
  const displayName = currentUser?.username ?? 'meai-user'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()

  const [commentContent, setCommentContent] = useState('')
  const [editingPost, setEditingPost] = useState<TPostResponse | null>(null)
  const [reportingPost, setReportingPost] = useState<TPostResponse | null>(null)
  const [deletingPost, setDeletingPost] = useState<TPostResponse | null>(null)
  const [reportingComment, setReportingComment] = useState<TCommentResponse | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)
  const [mediaViewer, setMediaViewer] = useState<MediaViewerState>({
    open: false,
    items: [],
    index: 0,
    fallbackType: null
  })

  const postQuery = useQuery({
    queryKey: feedKeys.detail(postId),
    enabled: Boolean(postId),
    queryFn: () => feedApi.getPostDetail(postId)
  })

  useEffect(() => {
    setIsInvalid(false)
  }, [paramUsername, postId])

  useEffect(() => {
    if (!postQuery.data) return
    if (!paramUsername) {
      setIsInvalid(true)
      return
    }
    if (paramUsername.toLowerCase() !== postQuery.data.username.toLowerCase()) {
      setIsInvalid(true)
    }
  }, [paramUsername, postQuery.data])

  const toggleLikeMutation = useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      isLiked ? feedApi.unlikePost(postId) : feedApi.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.detail(postId) })
      const previous = queryClient.getQueryData<TPostResponse>(feedKeys.detail(postId))

      queryClient.setQueryData<TPostResponse>(feedKeys.detail(postId), (current) =>
        current
          ? {
              ...current,
              isLikedByCurrentUser: !isLiked,
              likesCount: Math.max(0, current.likesCount + (isLiked ? -1 : 1))
            }
          : current
      )

      return { previous }
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKeys.detail(variables.postId), context.previous)
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<TPostResponse>(feedKeys.detail(variables.postId), (current) =>
        current
          ? {
              ...current,
              isLikedByCurrentUser: data.isLikedByCurrentUser,
              likesCount: data.likesCount
            }
          : current
      )
    }
  })

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!postId) {
        throw new Error('Missing post')
      }
      const trimmed = commentContent.trim()
      if (!trimmed) {
        throw new Error('Missing content')
      }
      return feedApi.createComment({ postId, content: trimmed })
    },
    onSuccess: () => {
      toast.success('Comment posted')
      setCommentContent('')
      queryClient.invalidateQueries({ queryKey: feedKeys.postComments(postId, COMMENT_LIMIT) })
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(postId) })
    },
    onError: () => {
      toast.error('Could not post comment')
    }
  })

  const handleRequireAuth = () => setIsSignInOpen(true)

  const handleToggleLike = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      toggleLikeMutation.mutate({ postId: post.id, isLiked: Boolean(post.isLikedByCurrentUser) })
    },
    [isAuthed, toggleLikeMutation]
  )

  const handleOpenMedia = useCallback((items: PostMediaItem[], index: number, fallbackType: string | null) => {
    setMediaViewer({ open: true, items, index, fallbackType })
  }, [])

  const handleCloseMedia = useCallback(() => {
    setMediaViewer((current) => ({ ...current, open: false }))
  }, [])

  const handlePrevMedia = useCallback(() => {
    setMediaViewer((current) => ({ ...current, index: Math.max(0, current.index - 1) }))
  }, [])

  const handleNextMedia = useCallback(() => {
    setMediaViewer((current) => ({
      ...current,
      index: Math.min(current.items.length - 1, current.index + 1)
    }))
  }, [])

  const handleEditPost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setEditingPost(post)
    },
    [isAuthed]
  )

  const handleReportPost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setReportingPost(post)
    },
    [isAuthed]
  )

  const handleDeletePost = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setDeletingPost(post)
    },
    [isAuthed]
  )

  const handleReportComment = useCallback(
    (comment: TCommentResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      setReportingComment(comment)
    },
    [isAuthed]
  )

  const handleUserClick = useCallback(
    (username: string) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      const userPath = PATH.USER_PROFILE.replace(':username', `@${username}`)
      navigate(userPath)
    },
    [isAuthed, navigate]
  )

  const handleSubmitComment = () => {
    if (!isAuthed) {
      setIsSignInOpen(true)
      return
    }
    if (createCommentMutation.isPending) return
    createCommentMutation.mutate()
  }

  const handleInvalidClose = () => {
    setIsInvalid(false)
    navigate(PATH.HOME)
  }

  const handleInvalidOpenChange = (open: boolean) => {
    if (!open) {
      handleInvalidClose()
    }
  }

  const post = postQuery.data
  const isBusy = createCommentMutation.isPending
  const canSubmit = commentContent.trim().length > 0
  const isPostOwner = useMemo(() => {
    if (!post?.username || !currentUser?.username) return false
    return post.username.toLowerCase() === currentUser.username.toLowerCase()
  }, [currentUser?.username, post?.username])

  return (
    <>
      <div className='flex flex-col gap-4 px-4 py-6 md:px-6'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon-lg'
            className='rounded-full'
            aria-label='Go back'
            onClick={() => navigate(PATH.HOME)}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
        </div>

        {postQuery.isLoading ? (
          <div className='flex flex-col gap-4'>
            <PostDetailSkeleton />
            <CommentListSkeleton />
          </div>
        ) : postQuery.isError || !post ? (
          <Card className='border-border bg-card'>
            <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
              <div>We could not load this post.</div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={() => postQuery.refetch()}>
                  Try again
                </Button>
                <Button variant='outline' size='sm' onClick={() => navigate(PATH.HOME)}>
                  Back to home
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isInvalid ? null : (
          <>
            <PostDetailCard
              post={post}
              isAuthed={isAuthed}
              onToggleLike={handleToggleLike}
              onOpenMedia={handleOpenMedia}
              onEditPost={handleEditPost}
              onReportPost={handleReportPost}
              onDeletePost={handleDeletePost}
              onRequireAuth={handleRequireAuth}
              onUserClick={handleUserClick}
            />

            <div className='flex flex-col gap-4'>
              {isAuthed ? (
                <Card className='border-border bg-card'>
                  <CardContent className='flex gap-3'>
                    <Avatar className='h-9 w-9'>
                      {currentUser?.avatarPresignedUrl ? (
                        <AvatarImage src={currentUser.avatarPresignedUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 space-y-2'>
                      <Textarea
                        rows={3}
                        placeholder='Write a comment...'
                        className='w-full max-w-full resize-none whitespace-pre-wrap wrap-break-word'
                        value={commentContent}
                        onChange={(event) => setCommentContent(event.target.value)}
                        disabled={isBusy}
                      />
                      <div className='flex justify-end'>
                        <Button onClick={handleSubmitComment} disabled={!canSubmit || isBusy}>
                          {isBusy ? 'Posting...' : 'Comment'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className='border-border bg-card'>
                  <CardContent className='flex items-center justify-between gap-4 text-sm text-muted-foreground'>
                    <span>Sign in to join the conversation.</span>
                    <Button variant='outline' size='sm' onClick={() => navigate(PATH.LOGIN)}>
                      Sign in
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isAuthed && (
                <CommentList
                  postId={postId}
                  limit={COMMENT_LIMIT}
                  isAuthed={isAuthed}
                  isPostOwner={isPostOwner}
                  onRequireAuth={handleRequireAuth}
                  onReportComment={handleReportComment}
                  onUserClick={handleUserClick}
                />
              )}
            </div>
          </>
        )}
      </div>

      <InvalidPostDialog
        isInvalid={isInvalid}
        handleInvalidOpenChange={handleInvalidOpenChange}
        handleInvalidClose={handleInvalidClose}
      />
      <EditPostDialog
        open={Boolean(editingPost)}
        post={editingPost}
        onOpenChange={(open) => setEditingPost((current) => (open ? current : null))}
      />
      <ReportPostDialog
        open={Boolean(reportingPost)}
        post={reportingPost}
        onOpenChange={(open) => setReportingPost((current) => (open ? current : null))}
      />
      <DeletePostDialog
        open={Boolean(deletingPost)}
        post={deletingPost}
        onOpenChange={(open) => setDeletingPost((current) => (open ? current : null))}
      />
      <ReportCommentDialog
        open={Boolean(reportingComment)}
        comment={reportingComment}
        onOpenChange={(open) => setReportingComment((current) => (open ? current : null))}
      />
      <SignInRequiredDialog open={isSignInOpen} onOpenChange={setIsSignInOpen} />
      <PostMediaViewerDialog
        open={mediaViewer.open}
        items={mediaViewer.items}
        index={mediaViewer.index}
        fallbackType={mediaViewer.fallbackType}
        onOpenChange={handleCloseMedia}
        onPrev={handlePrevMedia}
        onNext={handleNextMedia}
      />
    </>
  )
}

export default PostDetail
