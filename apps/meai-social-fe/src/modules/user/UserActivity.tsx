import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { type NotificationDeliveryModel } from '@/models/notification.model'
import { formatRelativeTime } from '@/utils'
import { BellIcon, HeartIcon, MessageCircleIcon, PenLineIcon, UserPlus2Icon } from 'lucide-react'
import { type ElementType, useCallback } from 'react'

const IconMapping: Record<string, ElementType> = {
  'Feed.Followed': UserPlus2Icon,
  'Feed.Commented': MessageCircleIcon,
  'Feed.NewPost': PenLineIcon,
  'Feed.PostLiked': HeartIcon,
  'Feed.CommentLiked': HeartIcon
}

function UserActivity() {
  const { items, isLoading, isConnected, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const _renderItem = useCallback(
    (item: NotificationDeliveryModel, index: number) => {
      const Icon = IconMapping[item.type] ?? BellIcon
      return (
        <Card
          key={item.userNotificationId || index}
          onClick={() => markAsRead(item.userNotificationId)}
          className={cn('cursor-pointer transition-colors', item.isRead ? 'bg-card' : 'bg-muted')}
        >
          <CardContent className='flex items-start gap-3'>
            <div className='flex-1 flex items-center gap-3'>
              <Icon className='h-8 w-8' />
              <div className='flex-1 space-y-1'>
                <CardTitle className='text-sm font-semibold text-foreground'>{item.title || 'Notification'}</CardTitle>
                <p className='text-sm text-foreground'>{item.message}</p>
                <p className='text-xs text-muted-foreground'>{formatRelativeTime(item.createdAt)}</p>
              </div>
            </div>
            {!item.isRead && <span className='mt-1 h-2 w-2 rounded-full bg-red-500' />}
          </CardContent>
        </Card>
      )
    },
    [items, markAsRead]
  )

  const _renderSkeleton = useCallback(() => {
    return (
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className='bg-card'>
            <CardHeader className='flex flex-row items-start justify-between gap-3'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-28' />
              </div>
              <Skeleton className='h-7 w-24 rounded-lg' />
            </CardHeader>
            <CardContent className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [])

  return (
    <div className='flex flex-col gap-4 px-4 py-6 md:px-6'>
      <div className='flex items-center justify-between md:p-4'>
        <div className='flex items-start gap-1'>
          <h1 className='text-2xl font-semibold text-foreground'>Activity</h1>
          <div aria-hidden='true' className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <Button variant='outline' size='sm' onClick={markAllAsRead} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>

      {isLoading ? (
        _renderSkeleton()
      ) : items.length === 0 ? (
        <Card className='border-dashed border-border bg-card'>
          <CardContent className='py-8 text-center text-sm text-muted-foreground'>No activities yet.</CardContent>
        </Card>
      ) : (
        <div className='flex flex-col gap-3'>{items.map((item, index) => _renderItem(item, index))}</div>
      )}
    </div>
  )
}

export default UserActivity
