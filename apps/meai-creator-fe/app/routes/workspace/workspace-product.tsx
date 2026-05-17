import PostBuilderListView from '@/components/post/PostBuilderListView';
import { PostBuilderClientApi } from '@/services/client/post-builder.client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

type ListCursor = {
  cursorCreatedAt?: string;
  cursorId?: string;
  limit: number;
};

const PAGE_SIZE = 12;

export default function WorkspaceProduct() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    {
      queryKey: ['post-builders', 'workspace', workspaceId],
      queryFn: ({ pageParam, signal }) =>
        PostBuilderClientApi.listWorkspacePostBuilders(workspaceId ?? '', pageParam, signal),
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
      },
      enabled: Boolean(workspaceId)
    }
  );

  const items = data?.pages.flatMap((page) => page.value ?? []) ?? [];

  return (
    <PostBuilderListView
      title='Workspace Content Sets'
      description='Post builders prepared within this workspace.'
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
        const wsId = item.workspaceId ?? workspaceId;
        if (wsId) {
          navigate(`/workspace/${wsId}/post-builder/${item.id}`);
        }
      }}
    />
  );
}
