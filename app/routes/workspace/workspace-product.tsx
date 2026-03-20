import PostListView from '@/components/post/PostListView';
import type { PostCursor } from '@/models/post.model';
import { fetchWorkspacePosts } from '@/services/client/post.client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';

const PAGE_SIZE = 20;

export default function WorkspaceProduct() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const useMockPosts = searchParams.get('mockPosts') === '1' || searchParams.get('mockPosts') === 'true';

  const { data, isLoading, isError, error, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['posts', 'workspace', workspaceId, PAGE_SIZE, useMockPosts],
      initialPageParam: null as PostCursor | null,
      queryFn: ({ pageParam, signal }) =>
        fetchWorkspacePosts(workspaceId ?? '', {
          limit: PAGE_SIZE,
          cursor: pageParam ?? undefined,
          signal,
          useMock: useMockPosts
        }),
      getNextPageParam: (lastPage) => {
        const posts = lastPage.value ?? [];

        if (posts.length < PAGE_SIZE) {
          return undefined;
        }

        const lastItem = posts[posts.length - 1];

        if (!lastItem?.createdAt || !lastItem.id) {
          return undefined;
        }

        return {
          cursorCreatedAt: lastItem.createdAt,
          cursorId: lastItem.id
        };
      },
      enabled: Boolean(workspaceId)
    });

  const posts = useMemo(() => data?.pages.flatMap((page) => page.value ?? []) ?? [], [data]);
  const initialError = isError && posts.length === 0;
  const backgroundErrorMessage = isError && posts.length > 0 && error instanceof Error ? error.message : undefined;

  return (
    <PostListView
      title='Workspace Product Posts'
      description='View all posts that belong to this workspace for the current user, including every recorded status.'
      posts={posts}
      isLoading={isLoading}
      isError={initialError}
      errorMessage={error instanceof Error ? error.message : undefined}
      backgroundErrorMessage={backgroundErrorMessage}
      isRefreshing={isFetching && !isLoading && !isFetchingNextPage}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={Boolean(hasNextPage)}
      onLoadMore={() => {
        void fetchNextPage();
      }}
      onRetry={() => {
        void refetch();
      }}
    />
  );
}
