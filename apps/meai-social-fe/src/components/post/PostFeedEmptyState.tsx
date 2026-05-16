import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const PostFeedEmptyState = React.memo(() => (
  <Card className='border-border bg-card'>
    <CardContent className='text-sm text-muted-foreground'>No posts yet. Follow someone or create a post.</CardContent>
  </Card>
))

export default PostFeedEmptyState
