import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function PostDetailSkeleton() {
  return (
    <Card className='border-border bg-card'>
      <CardContent className='flex flex-col gap-3 sm:gap-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-9 rounded-full sm:h-10 sm:w-10' />
            <div className='space-y-2'>
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
          <Skeleton className='h-8 w-8 rounded-md' />
        </div>

        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-11/12' />
          <Skeleton className='h-4 w-9/12' />
        </div>

        <Skeleton className='h-56 w-full rounded-xl' />

        <div className='flex items-center gap-4'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-16' />
        </div>
      </CardContent>
    </Card>
  )
}

export default PostDetailSkeleton
