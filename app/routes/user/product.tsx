import PostListView from '@/components/post/PostListView';

import { deletePost, fetchPosts } from '@/services/client/post.client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function Product() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'all'],
    queryFn: ({ pageParam, signal }) => fetchPosts(pageParam, signal),
    initialPageParam: { cursorCreatedAt: undefined, cursorId: undefined, limit: 12 } as { cursorCreatedAt?: string; cursorId?: string; limit?: number },
    getNextPageParam: (lastPage) => {
      const posts = lastPage.value || [];
      if (posts.length < 12) return undefined;
      const lastItem = posts[posts.length - 1];
      return {
        cursorCreatedAt: lastItem.createdAt ?? undefined,
        cursorId: lastItem.id,
        limit: 12
      };
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      toast.success('Post deleted successfully.');
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.type === 'Subscription.Required') {
        toast.error(errData.detail || 'An active subscription is required.');
      } else {
        toast.error(errData?.detail || error.message || 'Failed to delete post.');
      }
    }
  });

  const posts = data?.pages.flatMap((page) => page.value ?? []) ?? [];

  return (
    <PostListView
      title='All Product Posts'
      description='View every post created for your account across all workspaces, sorted by newest first.'
      posts={posts as any}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
      onRetry={() => {
        void refetch();
      }}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onPostClick={(postId) => {
        const clickedPost = posts.find((p: any) => p.id === postId);
        if (clickedPost && (clickedPost as any).isPublished) {
          navigate(`/user/product/${postId}`);
        } else {
          navigate(`/post-builder/${postId}`);
        }
      }}
      onPostDelete={async (postId) => {
        await deleteMutation.mutateAsync(postId);
      }}
      isDeletingPost={deleteMutation.isPending}
    />
  );
}

