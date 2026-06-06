import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Resource, ResourceCursor } from '@/models/resource.model';
import { fetchResources } from '@/services/client/resource.client';
import { resolveMediaFormatLabel } from '@/utils/media-format';

type ImportedMedia = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'other';
  name: string;
  format: string;
};

type DialogImportUserMediaProps = {
  isOpen: boolean;
  onClose: () => void;
  handleAdd: (picked: ImportedMedia[]) => void;
  limit?: number;
  allowedTypes?: Array<'image' | 'video'>;
  excludeIds?: string[];
};

type TabType = 'user' | 'ai';

const RESOURCE_PAGE_SIZE = 100;

function resolveMediaType(resource: Resource): 'image' | 'video' | 'other' {
  const content = resource.contentType?.toLowerCase() ?? '';
  if (content.startsWith('video/') || resource.resourceType?.toLowerCase() === 'video') return 'video';
  if (content.startsWith('image/') || resource.resourceType?.toLowerCase() === 'image') return 'image';
  return 'other';
}

function DialogImportUserMedia({
  isOpen,
  onClose,
  handleAdd,
  limit,
  allowedTypes = ['image', 'video'],
  excludeIds = []
}: DialogImportUserMediaProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('user');

  const { data, isLoading, isError, refetch, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['dialog-import-user-media-resources'],
    initialPageParam: null as ResourceCursor | null,
    queryFn: ({ pageParam, signal }) =>
      fetchResources({
        limit: RESOURCE_PAGE_SIZE,
        cursor: pageParam ?? undefined,
        signal
      }),
    enabled: isOpen,
    staleTime: 30_000,
    getNextPageParam: (lastPage) => {
      if (lastPage.value.length < RESOURCE_PAGE_SIZE) {
        return undefined;
      }

      const lastItem = lastPage.value[lastPage.value.length - 1];
      if (!lastItem?.createdAt || !lastItem?.id) {
        return undefined;
      }

      return {
        cursorCreatedAt: lastItem.createdAt,
        cursorId: lastItem.id
      };
    }
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setActiveTab('user');
    }
  }, [isOpen]);

  const excludeIdSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const resources = useMemo(() => data?.pages.flatMap((page) => page.value) ?? [], [data]);

  const userUploadItems = useMemo(() => {
    return resources
      .filter((r) => !r.originChatId)
      .map((r) => ({
        id: r.id,
        url: r.link,
        type: resolveMediaType(r),
        name: r.id,
        format: resolveMediaFormatLabel({ contentType: r.contentType, url: r.link, fallback: r.resourceType })
      }))
      .filter((item) => item.type !== 'other' && !excludeIdSet.has(item.id));
  }, [excludeIdSet, resources]);

  const aiGenerationItems = useMemo(() => {
    return resources
      .filter((r) => r.originChatId)
      .map((r) => ({
        id: r.id,
        url: r.link,
        type: resolveMediaType(r),
        name: r.id,
        format: resolveMediaFormatLabel({ contentType: r.contentType, url: r.link, fallback: r.resourceType })
      }))
      .filter((item) => item.type !== 'other' && !excludeIdSet.has(item.id));
  }, [excludeIdSet, resources]);

  const itemsByTab = useMemo(
    () => ({
      user: userUploadItems,
      ai: aiGenerationItems
    }),
    [userUploadItems, aiGenerationItems]
  );

  const currentTabItems = itemsByTab[activeTab];
  const selectedCount = selectedIds.length;
  const isAtLimit = typeof limit === 'number' && selectedCount >= limit;
  const allowedTypeSet = useMemo(() => new Set(allowedTypes), [allowedTypes]);

  const isTypeAllowed = (type: ImportedMedia['type']) => {
    if (type === 'other') return false;
    return allowedTypeSet.has(type);
  };

  const toggleSelected = (id: string) => {
    const allItems = [...userUploadItems, ...aiGenerationItems];
    const targetItem = allItems.find((item) => item.id === id);

    if (!targetItem || !isTypeAllowed(targetItem.type)) return;

    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((x) => x !== id);
      if (isAtLimit) return prev;
      return [...prev, id];
    });
  };

  const handleConfirmAdd = () => {
    const allItems = [...userUploadItems, ...aiGenerationItems];
    const picked = allItems.filter((item) => selectedIds.includes(item.id) && isTypeAllowed(item.type));
    handleAdd(picked);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className='max-h-[90vh] w-[calc(100vw-2rem)] max-w-[1100px] gap-0 overflow-hidden border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] p-0 text-zinc-100'
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateRows: 'auto auto minmax(0, 1fr) auto'
        }}
      >
        <DialogHeader className='shrink-0 border-b border-zinc-800 px-6 py-4'>
          <DialogTitle className='pr-10'>Import from your library</DialogTitle>
        </DialogHeader>
        <div className='flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4'>
          <div className='flex flex-wrap items-center gap-2'>
            {(['user', 'ai'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              const label = tab === 'user' ? 'Uploads & Social' : 'AI Generations';
              const count = itemsByTab[tab].length;

              return (
                <button
                  key={tab}
                  type='button'
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/45 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80'
                  )}
                >
                  <span>{label}</span>
                  <span className='rounded-full bg-black/30 px-2 py-0.5 text-xs text-zinc-400'>{count}</span>
                </button>
              );
            })}
          </div>
          <span className='rounded-full border px-4 py-2 text-sm font-medium border-zinc-800 bg-zinc-900/45'>
            {typeof limit === 'number' ? `${selectedCount}/${limit}` : selectedCount} selected
          </span>
        </div>

        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12 text-zinc-400'>
              <Loader2 className='h-5 w-5 animate-spin text-purple-400' />
              <span className='ml-2 text-sm'>Loading your library...</span>
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center justify-center gap-3 py-12 text-zinc-400'>
              <p className='text-sm'>Couldn't load your library.</p>
              <Button variant='outline' size='sm' onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : currentTabItems.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/35 py-16 text-center text-zinc-400'>
              <p className='text-sm font-medium text-white'>No {activeTab === 'user' ? 'uploads' : 'AI generations'}</p>
              <p className='mt-1 text-xs'>
                {activeTab === 'user' ? 'Upload media' : 'Generate media'} to see items here.
              </p>
            </div>
          ) : (
            <div
              className='grid gap-4'
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
            >
              {currentTabItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isDisallowedType = !isTypeAllowed(item.type);
                const isLocked = isDisallowedType || (!isSelected && isAtLimit);

                return (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => toggleSelected(item.id)}
                    disabled={isLocked}
                    className={cn(
                      'group relative aspect-square min-w-0 overflow-hidden rounded-lg border bg-zinc-900 text-left',
                      isLocked && 'cursor-not-allowed border-none opacity-40 grayscale',
                      isDisallowedType && 'opacity-30',
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40'
                        : 'border-zinc-700 hover:border-zinc-500'
                    )}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} className='absolute inset-0 h-full w-full object-cover' muted playsInline />
                    ) : (
                      <img
                        src={item.url}
                        alt='Library media item'
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                      />
                    )}

                    {item.type === 'video' && (
                      <span className='absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white'>
                        <Play className='h-3.5 w-3.5 fill-white text-white' />
                      </span>
                    )}

                    <span className='absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase text-white'>
                      {item.format}
                    </span>

                    {isDisallowedType && (
                      <span className='absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200'>
                        Not allowed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && hasNextPage && currentTabItems.length > 0 && (
            <div className='flex justify-center pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className='border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className='shrink-0 border-t border-zinc-800 px-6 py-4'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='min-w-32 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white'
              >
                Close
              </Button>
            </DialogClose>
            <Button
              type='button'
              onClick={handleConfirmAdd}
              disabled={selectedCount === 0}
              className='min-w-32 bg-purple-600 text-white hover:bg-purple-700'
            >
              Import{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogImportUserMedia;
export type { ImportedMedia, DialogImportUserMediaProps };
