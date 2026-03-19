import PostListView from '@/components/post/PostListView';
import { mockWorkspacePosts } from '@/data/mock-posts';
import { fetchWorkspacePosts } from '@/services/client/post.client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';

export default function WorkspaceProduct() {
  const { workspaceId } = useParams();
  const useMockPosts = true;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['posts', 'workspace', workspaceId],
    queryFn: ({ signal }) => fetchWorkspacePosts(workspaceId ?? '', signal),
    enabled: Boolean(workspaceId)
  });

  const posts = useMockPosts ? mockWorkspacePosts : (data?.value ?? []);

  return (
    <PostListView
      title='Workspace Product Posts'
      description='View all posts that belong to this workspace for the current user, including every recorded status.'
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
