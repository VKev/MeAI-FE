import { PencilLine } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import type { TPostResponse } from '@/models/feed.model'
import { PATH } from '@/routes/path'
import { useFeedInfiniteQuery, useToggleLike } from '@/hooks/use-feed'
import CreatePostDialog from '@/components/post/CreatePostDialog'
import DeletePostDialog from '@/components/post/DeletePostDialog'
import EditPostDialog from '@/components/post/EditPostDialog'
import PostCard from '@/components/post/PostCard'
import PostFeedEmptyState from '@/components/post/PostFeedEmptyState'
import PostFeedSkeleton from '@/components/post/PostFeedSkeleton'
import PostMediaViewerDialog from '@/components/post/PostMediaViewerDialog'
import ReportPostDialog from '@/components/post/ReportPostDialog'
import type { PostMediaItem } from '@/components/post/PostMediaScroller'
import SignInRequiredDialog from '@/components/user/SignInRequiredDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEED_LIMIT = 10

type MediaViewerState = {
  open: boolean
  items: PostMediaItem[]
  index: number
  fallbackType: string | null
}

function PostFeed() {
  const navigate = useNavigate()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const isAuthed = Boolean(currentUser)
  const profilePath = useMemo(
    () => PATH.USER_PROFILE.replace(':username', `@${currentUser?.username ?? 'me'}`),
    [currentUser?.username]
  )
  const avatarUrl = currentUser?.avatarPresignedUrl ?? null
  const displayName = currentUser?.username ?? 'meai-user'
  const avatarFallback = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName])
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<TPostResponse | null>(null)
  const [reportingPost, setReportingPost] = useState<TPostResponse | null>(null)
  const [deletingPost, setDeletingPost] = useState<TPostResponse | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [mediaViewer, setMediaViewer] = useState<MediaViewerState>({
    open: false,
    items: [],
    index: 0,
    fallbackType: null
  })
  const feedQuery = useFeedInfiniteQuery({ enabled: true, limit: FEED_LIMIT })
  const toggleLike = useToggleLike(FEED_LIMIT)
  const posts = useMemo(() => feedQuery.data?.pages.flat() ?? [], [feedQuery.data])

  const handleCompose = useCallback(() => {
    if (!isAuthed) {
      setIsSignInOpen(true)
      return
    }
    setIsComposerOpen(true)
  }, [isAuthed])

  const handleOpenDetail = useCallback(
    (post: TPostResponse) => {
      navigate(PATH.POST_DETAIL.replace(':username', `@${post.username}`).replace(':postId', post.id))
    },
    [navigate]
  )

  const handleToggleLike = useCallback(
    (post: TPostResponse) => {
      if (!isAuthed) {
        setIsSignInOpen(true)
        return
      }
      toggleLike.mutate({ postId: post.id, isLiked: Boolean(post.isLikedByCurrentUser) })
    },
    [isAuthed, toggleLike]
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

  useEffect(() => {
    if (!isAuthed || !feedQuery.hasNextPage) return
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (feedQuery.isFetchingNextPage) return
        feedQuery.fetchNextPage()
      },
      { rootMargin: '240px' }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [feedQuery.fetchNextPage, feedQuery.hasNextPage, feedQuery.isFetchingNextPage, isAuthed])

  return (
    <>
      <div className='flex flex-col gap-4 px-4 py-6 md:px-6'>
        {isAuthed ? (
          <Card className='border-border bg-card'>
            <CardContent className='flex flex-col gap-3'>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex-1 flex items-center gap-3'>
                  <Avatar className='cursor-pointer' onClick={() => navigate(profilePath)}>
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 text-sm text-muted-foreground cursor-text' onClick={handleCompose}>
                    Hello {displayName}, any thoughts today?
                  </div>
                </div>
                <Button variant='outline' size='lg' className='gap-2 w-full sm:w-auto' onClick={handleCompose}>
                  <PencilLine className='h-4 w-4' />
                  Write something
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {feedQuery.isLoading ? (
          <PostFeedSkeleton />
        ) : feedQuery.isError ? (
          <Card className='border-border bg-card'>
            <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
              <div>Something went wrong while loading your feed.</div>
              <Button variant='outline' size='sm' onClick={() => feedQuery.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <PostFeedEmptyState />
        ) : (
          <div className='flex flex-col gap-4'>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAuthed={isAuthed}
                onOpenDetail={handleOpenDetail}
                onToggleLike={handleToggleLike}
                onOpenMedia={handleOpenMedia}
                onEditPost={handleEditPost}
                onReportPost={handleReportPost}
                onDeletePost={handleDeletePost}
                onUserClick={handleUserClick}
              />
            ))}
          </div>
        )}

        {isAuthed && feedQuery.hasNextPage ? <div ref={loadMoreRef} className='h-1 w-full' /> : null}
      </div>

      <CreatePostDialog open={isComposerOpen} onOpenChange={setIsComposerOpen} />
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

export default PostFeed
