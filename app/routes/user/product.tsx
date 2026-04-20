import PostBuilderListView from '@/components/post/PostBuilderListView';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

type ListCursor = {
  cursorCreatedAt?: string;
  cursorId?: string;
  limit: number;
};

const PAGE_SIZE = 12;

export default function Product() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    {
      queryKey: ['post-builders', 'all'],
      queryFn: ({ pageParam, signal }) => PostBuilderClientApi.listUserPostBuilders(pageParam, signal),
      initialPageParam: { limit: PAGE_SIZE } as ListCursor,
      getNextPageParam: (lastPage) => {
        const rows = lastPage.value ?? [];
        if (rows.length < PAGE_SIZE) return undefined;
        const last = rows[rows.length - 1];
        return {
          cursorCreatedAt: last.createdAt ?? undefined,
          cursorId: last.id,
          limit: PAGE_SIZE
        };
      }
    }
  );

  const items = data?.pages.flatMap((page) => page.value ?? []) ?? [];

  return (
    <PostBuilderListView
      title='Your Content Sets'
      description='Every post builder you have prepared, grouped across workspaces.'
      items={items}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
      onRetry={() => {
        void refetch();
      }}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onItemClick={(item) => {
        if (item.workspaceId) {
          navigate(`/workspace/${item.workspaceId}/post-builder/${item.id}`);
        }
      }}
    />
  );
}
