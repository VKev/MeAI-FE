import PostListView from '@/components/post/PostListView';
import type { PostCursor } from '@/models/post.model';
import { fetchPosts } from '@/services/client/post.client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

const PAGE_SIZE = 20;

export default function Product() {
  const [searchParams] = useSearchParams();
  const useMockPosts = searchParams.get('mockPosts') === '1' || searchParams.get('mockPosts') === 'true';

  const { data, isLoading, isError, error, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['posts', 'all', PAGE_SIZE, useMockPosts],
      initialPageParam: null as PostCursor | null,
      queryFn: ({ pageParam, signal }) =>
        fetchPosts({
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
      }
    });

  const posts = useMemo(() => data?.pages.flatMap((page) => page.value ?? []) ?? [], [data]);
  const initialError = isError && posts.length === 0;
  const backgroundErrorMessage = isError && posts.length > 0 && error instanceof Error ? error.message : undefined;

  return (
    <PostListView
      title='All Product Posts'
      description='View every post created for your account across all workspaces, sorted by newest first.'
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
