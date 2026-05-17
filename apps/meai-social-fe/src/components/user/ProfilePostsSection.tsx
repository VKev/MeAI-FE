import React from 'react'
import { PencilLine } from 'lucide-react'
import type { TPostResponse } from '@/models/feed.model'
import type { PostMediaItem } from '@/components/post/PostMediaScroller'
import PostCard from '@/components/post/PostCard'
import PostFeedSkeleton from '@/components/post/PostFeedSkeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ProfileComposerCardProps = {
  displayName: string
  avatarUrl?: string | null
  avatarFallback: string
  onCompose: () => void
}

type ProfilePostsSectionProps = {
  isLoading: boolean
  isError: boolean
  posts: TPostResponse[]
  isAuthed: boolean
  onRetry: () => void
  onOpenDetail: (post: TPostResponse) => void
  onToggleLike: (post: TPostResponse) => void
  onOpenMedia: (items: PostMediaItem[], index: number, fallbackType: string | null) => void
  onEditPost: (post: TPostResponse) => void
  onReportPost: (post: TPostResponse) => void
  onDeletePost: (post: TPostResponse) => void
  onUserClick: (username: string) => void
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  hasNextPage: boolean
}

export const ProfileComposerCard = React.memo(
  ({ displayName, avatarUrl, avatarFallback, onCompose }: ProfileComposerCardProps) => (
    <Card className='border-border bg-card'>
      <CardContent className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex-1 flex items-center gap-3'>
            <Avatar className='cursor-pointer'>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className='flex-1 text-sm text-muted-foreground cursor-text' onClick={onCompose}>
              Hello {displayName}, any thoughts today?
            </div>
          </div>
          <Button variant='outline' size='lg' className='gap-2 w-full sm:w-auto' onClick={onCompose}>
            <PencilLine className='h-4 w-4' />
            Write something
          </Button>
        </div>
      </CardContent>
    </Card>
  )
)

export const ProfilePostsSection = React.memo(
  ({
    isLoading,
    isError,
    posts,
    isAuthed,
    onRetry,
    onOpenDetail,
    onToggleLike,
    onOpenMedia,
    onEditPost,
    onReportPost,
    onDeletePost,
    onUserClick,
    loadMoreRef,
    hasNextPage
  }: ProfilePostsSectionProps) => {
    if (isLoading) return <PostFeedSkeleton />
    if (isError) {
      return (
        <Card className='border-border bg-card'>
          <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
            <div>Something went wrong while loading posts.</div>
            <Button variant='outline' size='sm' onClick={onRetry}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (posts.length === 0) {
      return (
        <Card className='border-border bg-card'>
          <CardContent className='text-sm text-muted-foreground'>No posts yet.</CardContent>
        </Card>
      )
    }

    return (
      <>
        <div className='flex flex-col gap-4'>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthed={isAuthed}
              onOpenDetail={onOpenDetail}
              onToggleLike={onToggleLike}
              onOpenMedia={onOpenMedia}
              onEditPost={onEditPost}
              onReportPost={onReportPost}
              onDeletePost={onDeletePost}
              onUserClick={onUserClick}
            />
          ))}
        </div>
        {hasNextPage ? <div ref={loadMoreRef} className='h-1 w-full' /> : null}
      </>
    )
  }
)
