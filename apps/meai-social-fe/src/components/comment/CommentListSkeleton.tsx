import { Skeleton } from '@/components/ui/skeleton'

type CommentListSkeletonProps = {
  items?: number
}

const DEFAULT_ITEMS = 3

function CommentListSkeleton({ items = DEFAULT_ITEMS }: CommentListSkeletonProps) {
  return (
    <div className='flex flex-col gap-4'>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className='rounded-xl border border-border bg-card p-4'>
          <div className='flex gap-3'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex-1 space-y-2'>
              <div className='space-y-1'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-16' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-3 w-12' />
                <Skeleton className='h-3 w-12' />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CommentListSkeleton
