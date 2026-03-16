import PostListView from '@/components/post/PostListView';
import { mockUserPosts } from '@/data/mock-posts';
import { fetchPosts } from '@/services/client/post.client';
import { useQuery } from '@tanstack/react-query';

export default function Product() {
  const useMockPosts = true;
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: ({ signal }) => fetchPosts(signal)
  });

  const posts = useMockPosts ? mockUserPosts : (data?.value ?? []);

  return (
    <PostListView
      title='All Product Posts'
      description='View every post created for your account across all workspaces, sorted by newest first.'
      posts={posts}
      isLoading={useMockPosts ? false : isLoading}
      isError={useMockPosts ? false : isError}
      errorMessage={error instanceof Error ? error.message : undefined}
      onRetry={() => {
        void refetch();
      }}
    />
  );
}
