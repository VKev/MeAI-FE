import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const PostFeedSkeleton = React.memo(() => (
  <div className='flex flex-col gap-4'>
    {Array.from({ length: 2 }).map((_, index) => (
      <Card key={`post-skeleton-${index}`} className='border-border bg-card'>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-start gap-3'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-3 w-36' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
          <Skeleton className='h-16 w-full' />
          <div className='flex gap-6'>
            <Skeleton className='h-3 w-12' />
            <Skeleton className='h-3 w-12' />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
))

export default PostFeedSkeleton
