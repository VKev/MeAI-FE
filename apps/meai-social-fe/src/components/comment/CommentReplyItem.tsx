import { Flag, Heart, MessageCircle, Trash2 } from 'lucide-react'
import { memo, useMemo } from 'react'
import type { TCommentResponse } from '@/models/feed.model'
import { formatRelativeTime } from '@/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getDisplayName } from '@/components/comment/comment-utils'
import CommentContent from '@/components/comment/CommentContent'

type CommentReplyItemProps = {
  reply: TCommentResponse
  isAuthed: boolean
  currentUsername: string | null
  canDelete: boolean
  canReport: boolean
  canReply?: boolean
  onReportComment: (comment: TCommentResponse) => void
  onRequireAuth: () => void
  onUserClick: (username: string) => void
  onToggleLike: (reply: TCommentResponse) => void
  onReplyTo: (reply: TCommentResponse) => void
  onDelete: (reply: TCommentResponse) => void
  isLikeBusy: boolean
  isDeleteBusy: boolean
}

const CommentReplyItem = memo(
  ({
    reply,
    isAuthed,
    currentUsername,
    canDelete,
    canReport,
    canReply = true,
    onReportComment,
    onRequireAuth,
    onUserClick,
    onToggleLike,
    onReplyTo,
    onDelete,
    isLikeBusy,
    isDeleteBusy
  }: CommentReplyItemProps) => {
    const displayName = useMemo(
      () => getDisplayName(reply.username, reply.userId, currentUsername),
      [reply.userId, reply.username, currentUsername]
    )
    const avatarFallback = displayName.slice(0, 2).toUpperCase()
    const timeLabel = useMemo(() => formatRelativeTime(reply.createdAt), [reply.createdAt])
    const isLiked = Boolean(reply.isLikedByCurrentUser)
    const heartClass = isLiked ? 'h-3 w-3 text-rose-500 fill-rose-500' : 'h-3 w-3'
    const handleLike = () => {
      if (!isAuthed) {
        onRequireAuth()
        return
      }
      onToggleLike(reply)
    }

    const handleReply = () => {
      if (!canReply) return
      if (!isAuthed) {
        onRequireAuth()
        return
      }
      onReplyTo(reply)
    }

    const handleUserClick = () => {
      if (!reply.username) return
      onUserClick(reply.username)
    }

    return (
      <div className='flex gap-3'>
        <Avatar className='h-7 w-7 cursor-pointer' onClick={handleUserClick}>
          {reply.avatarUrl ? <AvatarImage src={reply.avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className='flex-1 space-y-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex flex-col text-xs text-foreground'>
              <span className='font-semibold break-all cursor-pointer' onClick={handleUserClick}>
                {displayName}
              </span>
              {timeLabel ? <span className='text-[11px] font-normal text-muted-foreground'>{timeLabel}</span> : null}
            </div>
            {isAuthed ? (
              <div className='flex items-center gap-1'>
                {canDelete ? (
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Delete reply'
                    onClick={() => onDelete(reply)}
                    disabled={isDeleteBusy}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                ) : null}
                {canReport ? (
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Report reply'
                    onClick={() => onReportComment(reply)}
                  >
                    <Flag className='h-4 w-4' />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <CommentContent content={reply.content} />
          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            <button
              type='button'
              className='flex items-center gap-1 hover:text-foreground'
              onClick={handleLike}
              disabled={isLikeBusy}
            >
              <Heart className={heartClass} />
              {reply.likesCount}
            </button>
            {canReply ? (
              <button type='button' className='flex items-center gap-1 hover:text-foreground' onClick={handleReply}>
                <MessageCircle className='h-3 w-3' />
                Reply
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
)

CommentReplyItem.displayName = 'CommentReplyItem'

export default CommentReplyItem
