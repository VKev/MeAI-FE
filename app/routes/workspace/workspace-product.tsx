import PostListView from '@/components/post/PostListView';
import { mockWorkspacePosts } from '@/data/mock-posts';
import { deletePost, fetchWorkspacePosts } from '@/services/client/post.client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

export default function WorkspaceProduct() {
  const { workspaceId } = useParams();
  const useMockPosts = true;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'workspace', workspaceId],
    queryFn: ({ pageParam, signal }) => fetchWorkspacePosts(workspaceId ?? '', pageParam, signal),
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
    },
    enabled: Boolean(workspaceId) && !useMockPosts
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      toast.success('Post deleted successfully.');
      void queryClient.invalidateQueries({ queryKey: ['posts', 'workspace', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete post.');
    }
  });

  const posts = useMockPosts
    ? mockWorkspacePosts
    : (data?.pages.flatMap((page) => page.value ?? []) ?? []);

  return (
    <PostListView
      title='Workspace Product Posts'
      description='View all posts that belong to this workspace.'
      posts={posts as any}
      isLoading={useMockPosts ? false : isLoading}
      isError={useMockPosts ? false : isError}
      errorMessage={error instanceof Error ? error.message : undefined}
      onRetry={() => {
        void refetch();
      }}
      hasNextPage={useMockPosts ? false : hasNextPage}
      isFetchingNextPage={useMockPosts ? false : isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onPostClick={(postId) => {
        const clickedPost = posts.find((p: any) => p.id === postId);
        if (clickedPost && (clickedPost as any).isPublished) {
          navigate(`/workspace/${workspaceId}/product/${postId}`);
        } else {
          navigate(`/post-builder?postId=${postId}`);
        }
      }}
      onPostDelete={async (postId) => {
        await deleteMutation.mutateAsync(postId);
      }}
      isDeletingPost={deleteMutation.isPending}
    />
  );
}

