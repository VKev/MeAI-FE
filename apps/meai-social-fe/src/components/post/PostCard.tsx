import React, { useCallback, useMemo } from 'react'
import { Copy, Flag, Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { TPostResponse } from '@/models/feed.model'
import { formatRelativeTime } from '@/utils'
import { PATH } from '@/routes/path'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import PostMediaScroller, { type PostMediaItem } from '@/components/post/PostMediaScroller'
import PostContent from '@/components/post/PostContent'
import { toast } from 'sonner'

type PostCardProps = {
  post: TPostResponse
  isAuthed: boolean
  onOpenDetail: (post: TPostResponse) => void
  onToggleLike: (post: TPostResponse) => void
  onOpenMedia: (items: PostMediaItem[], index: number, fallbackType: string | null) => void
  onEditPost: (post: TPostResponse) => void
  onReportPost: (post: TPostResponse) => void
  onDeletePost: (post: TPostResponse) => void
  onUserClick: (username: string) => void
}

const PostCard = React.memo(
  ({
    post,
    isAuthed,
    onOpenDetail,
    onToggleLike,
    onOpenMedia,
    onEditPost,
    onReportPost,
    onDeletePost,
    onUserClick
  }: PostCardProps) => {
    const timeLabel = useMemo(() => formatRelativeTime(post.createdAt), [post.createdAt])
    const isLiked = Boolean(post.isLikedByCurrentUser)
    const heartClass = isLiked ? 'h-4 w-4 text-rose-500 fill-rose-500' : 'h-4 w-4'

    const mediaItems = useMemo<PostMediaItem[]>(() => {
      if (post.media?.length) {
        return post.media.map((item) => ({
          url: item.presignedUrl,
          contentType: item.contentType,
          resourceType: item.resourceType
        }))
      }
      if (post.mediaUrl) {
        return [{ url: post.mediaUrl, contentType: null, resourceType: post.mediaType }]
      }
      return []
    }, [post.media, post.mediaUrl, post.mediaType])

    const handleOpenDetail = useCallback(() => onOpenDetail(post), [onOpenDetail, post])
    const handleLike = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        onToggleLike(post)
      },
      [onToggleLike, post]
    )
    const handleComment = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        onOpenDetail(post)
      },
      [onOpenDetail, post]
    )

    const handleReport = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onReportPost(post)
      },
      [onReportPost, post]
    )

    const handleEdit = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onEditPost(post)
      },
      [onEditPost, post]
    )

    const handleDelete = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onDeletePost(post)
      },
      [onDeletePost, post]
    )

    const handleCopyLink = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        const detailPath = PATH.POST_DETAIL.replace(':username', `@${post.username}`).replace(':postId', post.id)
        const url = `${window.location.origin}${detailPath}`
        void navigator.clipboard?.writeText(url)
        toast.success('Copy link successfully')
      },
      [post.id, post.username]
    )

    const handleUserClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onUserClick(post.username)
      },
      [onUserClick, post.username]
    )

    return (
      <Card className='border-border bg-card transition hover:shadow-sm'>
        <CardContent className='flex flex-col gap-3 sm:gap-4'>
          <div className='flex items-start justify-between gap-3 cursor-pointer' onClick={handleOpenDetail}>
            <div className='flex items-center justify-start gap-2' onClick={handleUserClick}>
              <Avatar className='h-9 w-9 sm:h-10 sm:w-10'>
                {post.avatarUrl ? <AvatarImage src={post.avatarUrl} alt={post.username} /> : null}
                <AvatarFallback>{post.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col items-start text-xs sm:text-sm font-semibold text-foreground'>
                <span className='break-all'>{post.username}</span>
                {timeLabel ? <span className='text-xs font-normal text-muted-foreground'>{timeLabel}</span> : null}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Open post menu'
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem className='gap-2' onClick={handleCopyLink}>
                  <Copy className='h-4 w-4' />
                  Copy link
                </DropdownMenuItem>
                {isAuthed &&
                  (post.canDelete ? (
                    <>
                      <DropdownMenuItem className='gap-2' onClick={handleEdit}>
                        <Pencil className='h-4 w-4' />
                        Edit post
                      </DropdownMenuItem>
                      <DropdownMenuItem variant='destructive' className='gap-2' onClick={handleDelete}>
                        <Trash2 className='h-4 w-4' />
                        Delete post
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem className='gap-2' onClick={handleReport}>
                      <Flag className='h-4 w-4' />
                      Report
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {post.content ? <PostContent content={post.content} /> : null}

          {mediaItems.length ? (
            <PostMediaScroller items={mediaItems} fallbackType={post.mediaType} onOpenMedia={onOpenMedia} />
          ) : null}

          <div className='flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground'>
            <button
              type='button'
              className='flex items-center gap-2 transition hover:text-foreground cursor-pointer'
              onClick={handleLike}
            >
              <Heart className={heartClass} />
              {post.likesCount}
            </button>
            <button
              type='button'
              className='flex items-center gap-2 transition hover:text-foreground cursor-pointer'
              onClick={handleComment}
            >
              <MessageCircle className='h-4 w-4' />
              {post.commentsCount}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }
)

export default PostCard
