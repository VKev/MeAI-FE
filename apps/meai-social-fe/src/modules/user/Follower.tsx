import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { PATH } from '@/routes/path'
import type { TFollowSuggestionResponse, TFollowUserResponse } from '@/models/feed.model'
import { useFollowSuggestions, useFollowersInfiniteQuery, useFollowingInfiniteQuery } from '@/hooks/use-follow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FOLLOW_LIMIT = 10
const SUGGEST_LIMIT = 10

type FollowCardUser = {
  username: string
  fullName: string | null
  avatarUrl: string | null
  postCount: number
}

type UserCardProps = {
  user: FollowCardUser
  onClick: (username: string) => void
}

const formatPostCount = (count: number) => `${count} post${count === 1 ? '' : 's'}`

const buildProfilePath = (username: string) => PATH.USER_PROFILE.replace(':username', `@${username}`)

function UserCard({ user, onClick }: UserCardProps) {
  const displayName = user.fullName ?? 'Unnamed'
  const avatarFallback = user.username.slice(0, 2).toUpperCase()

  return (
    <Card className='border-border bg-card transition hover:border-border hover:shadow-sm'>
      <CardContent>
        <button
          type='button'
          className='flex w-full items-center gap-3 text-left'
          onClick={() => onClick(user.username)}
        >
          <Avatar size='lg'>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-col gap-1'>
            <div className='text-sm font-semibold text-foreground'>@{user.username}</div>
            <div className='text-xs text-muted-foreground'>
              {displayName} · {formatPostCount(user.postCount)}
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  )
}

function UserListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`skeleton-${index}`} className='border-border bg-card'>
          <CardContent>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Follower() {
  const navigate = useNavigate()
  const currentUser = useSelector((state: RootState) => state.currentUser.currentUser)
  const userId = currentUser?.id
  const [suggestLimit, setSuggestLimit] = useState(SUGGEST_LIMIT)

  const suggestionsQuery = useFollowSuggestions({ limit: suggestLimit, enabled: true })
  const followersQuery = useFollowersInfiniteQuery({ userId, limit: FOLLOW_LIMIT, enabled: Boolean(userId) })
  const followingQuery = useFollowingInfiniteQuery({ userId, limit: FOLLOW_LIMIT, enabled: Boolean(userId) })

  const suggestions = useMemo(() => suggestionsQuery.data ?? [], [suggestionsQuery.data])
  const followers = useMemo(() => followersQuery.data?.pages.flat() ?? [], [followersQuery.data])
  const following = useMemo(() => followingQuery.data?.pages.flat() ?? [], [followingQuery.data])

  const handleUserClick = useCallback(
    (username: string) => {
      navigate(buildProfilePath(username))
    },
    [navigate]
  )

  const renderEmptyState = useCallback((message: string) => {
    return (
      <Card className='border-dashed border-border bg-card'>
        <CardContent className='py-8 text-center text-sm text-muted-foreground'>{message}</CardContent>
      </Card>
    )
  }, [])

  const renderErrorState = useCallback((message: string, onRetry: () => void) => {
    return (
      <Card className='border-border bg-card'>
        <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
          <div>{message}</div>
          <Button variant='outline' size='sm' onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }, [])

  const renderUserGrid = useCallback(
    (users: FollowCardUser[]) => {
      return (
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          {users.map((user) => (
            <UserCard key={user.username} user={user} onClick={handleUserClick} />
          ))}
        </div>
      )
    },
    [handleUserClick]
  )

  const renderFollowGrid = useCallback(
    (users: TFollowUserResponse[]) =>
      renderUserGrid(
        users.map((user) => ({
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          postCount: user.postCount
        }))
      ),
    [renderUserGrid]
  )

  const renderSuggestionGrid = useCallback(
    (users: TFollowSuggestionResponse[]) =>
      renderUserGrid(
        users.map((user) => ({
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          postCount: user.postCount
        }))
      ),
    [renderUserGrid]
  )

  const showSuggestionLoadMore = suggestions.length >= suggestLimit

  return (
    <div className='flex flex-col gap-6 px-4 py-6 md:px-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold text-foreground'>Grow your network</h1>
        <p className='text-sm text-muted-foreground'>Discover new people and manage your followers.</p>
      </div>

      <section className='space-y-3'>
        {suggestionsQuery.isLoading ? (
          <UserListSkeleton />
        ) : suggestionsQuery.isError ? (
          renderErrorState('Unable to load suggestions right now.', () => suggestionsQuery.refetch())
        ) : suggestions.length === 0 ? (
          renderEmptyState('No suggestions available yet.')
        ) : (
          renderSuggestionGrid(suggestions)
        )}

        {showSuggestionLoadMore ? (
          <div className='flex justify-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSuggestLimit((current) => current + SUGGEST_LIMIT)}
              disabled={suggestionsQuery.isFetching}
            >
              {suggestionsQuery.isFetching ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </section>

      <Tabs defaultValue='followers' className='w-full space-y-2'>
        <TabsList variant='line' className='w-full justify-start gap-2'>
          <TabsTrigger value='followers'>Followers ({followers.length})</TabsTrigger>
          <TabsTrigger value='following'>Following ({following.length})</TabsTrigger>
        </TabsList>

        <TabsContent value='followers' className='space-y-3'>
          {followersQuery.isLoading ? (
            <UserListSkeleton />
          ) : followersQuery.isError ? (
            renderErrorState('Unable to load followers right now.', () => followersQuery.refetch())
          ) : followers.length === 0 ? (
            renderEmptyState('No followers yet.')
          ) : (
            renderFollowGrid(followers)
          )}

          {followersQuery.hasNextPage ? (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => followersQuery.fetchNextPage()}
                disabled={followersQuery.isFetchingNextPage}
              >
                {followersQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value='following' className='space-y-3'>
          {followingQuery.isLoading ? (
            <UserListSkeleton />
          ) : followingQuery.isError ? (
            renderErrorState('Unable to load following right now.', () => followingQuery.refetch())
          ) : following.length === 0 ? (
            renderEmptyState('You are not following anyone yet.')
          ) : (
            renderFollowGrid(following)
          )}

          {followingQuery.hasNextPage ? (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => followingQuery.fetchNextPage()}
                disabled={followingQuery.isFetchingNextPage}
              >
                {followingQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Follower
