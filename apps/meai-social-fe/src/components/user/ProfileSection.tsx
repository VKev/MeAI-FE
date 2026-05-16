import React from 'react'
import { ArrowLeft } from 'lucide-react'
import type { TPublicProfileResponse } from '@/models/feed.model'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type ProfileHeaderProps = {
  onBack: () => void
}

export type ProfileInfoCardProps = {
  profile: TPublicProfileResponse
  username: string
  displayName: string
  avatarFallback: string
  isOwner: boolean
  isFollowing: boolean
  isFollowPending: boolean
  onEditProfile: () => void
  onChangePassword: () => void
  onToggleFollow: () => void
  onOpenFollowers: () => void
  onOpenFollowing: () => void
}

type ProfileErrorCardProps = {
  onRetry: () => void
  onBack: () => void
}

export const ProfileHeader = React.memo(({ onBack }: ProfileHeaderProps) => (
  <div className='flex items-center gap-2'>
    <Button variant='outline' size='icon-lg' className='rounded-full' aria-label='Go back' onClick={onBack}>
      <ArrowLeft className='h-4 w-4' />
    </Button>
  </div>
))

export const ProfileSkeleton = React.memo(() => (
  <Card className='border-border bg-card'>
    <CardContent className='flex flex-col items-center gap-4'>
      <Skeleton className='h-16 w-16 rounded-full md:h-20 md:w-20' />
      <div className='grid w-full max-w-sm grid-cols-3 gap-4 md:gap-6'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`stat-${index}`} className='space-y-2 text-center'>
            <Skeleton className='mx-auto h-4 w-10' />
            <Skeleton className='mx-auto h-3 w-12' />
          </div>
        ))}
      </div>
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-9 w-40' />
    </CardContent>
  </Card>
))

export const ProfileErrorCard = React.memo(({ onRetry, onBack }: ProfileErrorCardProps) => (
  <Card className='border-border bg-card'>
    <CardContent className='flex flex-col gap-3 text-sm text-muted-foreground'>
      <div>We could not load this profile.</div>
      <div className='flex gap-2'>
        <Button variant='outline' size='sm' onClick={onRetry}>
          Try again
        </Button>
        <Button variant='outline' size='sm' onClick={onBack}>
          Back to home
        </Button>
      </div>
    </CardContent>
  </Card>
))

export const ProfileInfoCard = React.memo(
  ({
    profile,
    username,
    displayName,
    avatarFallback,
    isOwner,
    isFollowing,
    isFollowPending,
    onEditProfile,
    onChangePassword,
    onToggleFollow,
    onOpenFollowers,
    onOpenFollowing
  }: ProfileInfoCardProps) => (
    <Card className='border-border bg-card'>
      <CardContent className='grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8'>
        <Avatar className='h-28 w-28 justify-self-center md:col-span-1 md:h-40 md:w-40'>
          {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.username} /> : null}
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className='space-y-4 text-center md:col-span-2 md:text-left'>
          <div className='grid w-full grid-cols-3 gap-4 text-center md:gap-6'>
            <div className='space-y-1 cursor-default'>
              <div className='text-xs text-muted-foreground md:text-md'>Posts</div>
              <div className='text-base font-semibold text-foreground'>{profile.postCount}</div>
            </div>
            <button type='button' className='space-y-1 cursor-default' onClick={onOpenFollowers}>
              <div className='text-xs text-muted-foreground md:text-md'>Followers</div>
              <div className='text-base font-semibold text-foreground'>{profile.followersCount}</div>
            </button>
            <button type='button' className='space-y-1 cursor-default' onClick={onOpenFollowing}>
              <div className='text-xs text-muted-foreground md:text-md'>Following</div>
              <div className='text-base font-semibold text-foreground'>{profile.followingCount}</div>
            </button>
          </div>
          <div className='flex flex-col'>
            <div className='text-2xl font-semibold text-start text-foreground md:text-4xl'>{displayName}</div>
            <div className='text-sm font-light italic text-start text-muted-foreground md:text-base'>@{username}</div>
          </div>
          {isOwner ? (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <Button variant='outline' className='w-full sm:flex-1' onClick={onEditProfile}>
                Edit profile
              </Button>
              <Button className='w-full sm:flex-1' onClick={onChangePassword}>
                Change password
              </Button>
            </div>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onClick={onToggleFollow}
              disabled={isFollowPending}
              className='w-full'
            >
              {isFollowing ? 'Followed' : 'Follow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
)
