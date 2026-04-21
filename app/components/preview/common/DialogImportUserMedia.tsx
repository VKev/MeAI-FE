import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DialogClose } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchResources } from '@/services/client/resource.client';
import type { Resource } from '@/models/resource.model';
import { Loader2, Play } from 'lucide-react';

type ImportedMedia = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'other';
  contentType: string | null;
  name: string;
};

type DialogImportUserMediaProps = {
  isOpen: boolean;
  onClose: () => void;
  handleAdd: (picked: ImportedMedia[]) => void;
  limit?: number;
  allowedTypes?: Array<'image' | 'video'>;
};

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
  limit = 3,
  allowedTypes
}: DialogImportUserMediaProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-resources-import'],
    queryFn: ({ signal }) => fetchResources({ limit: 100, signal }),
    enabled: isOpen,
    staleTime: 30_000
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  const items: ImportedMedia[] = useMemo(() => {
    const raw = data?.value ?? [];
    const mapped = raw.map<ImportedMedia>((r) => ({
      id: r.id,
      url: r.link,
      type: resolveMediaType(r),
      contentType: r.contentType,
      name: r.id
    }));
    if (!allowedTypes || allowedTypes.length === 0) return mapped;
    return mapped.filter((m) => m.type !== 'other' && allowedTypes.includes(m.type));
  }, [data, allowedTypes]);

  const selectedCount = selectedIds.length;
  const isAtLimit = selectedCount >= limit;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((x) => x !== id);
      if (isAtLimit) return prev;
      return [...prev, id];
    });
  };

  const handleConfirmAdd = () => {
    const picked = items.filter((item) => selectedIds.includes(item.id));
    handleAdd(picked);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='min-w-4xl max-w-7xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100'>
        <DialogHeader className='border-b border-zinc-800 px-6 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <DialogTitle>Import from your library</DialogTitle>
            <span className='text-sm text-zinc-400'>
              {selectedCount}/{limit} selected
            </span>
          </div>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-y-auto px-6 py-5'>
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
          ) : items.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center text-zinc-400'>
              <p className='text-sm font-medium text-white'>No media yet</p>
              <p className='mt-1 text-xs'>Generate or upload media to the library, then come back here to import it.</p>
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isLocked = !isSelected && isAtLimit;

                return (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => toggleSelected(item.id)}
                    disabled={isLocked}
                    className={cn(
                      'group relative h-45 w-45 overflow-hidden rounded-lg border bg-zinc-900 text-left',
                      isLocked && 'cursor-not-allowed opacity-40 grayscale border-none',
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40'
                        : 'border-zinc-700 hover:border-zinc-500'
                    )}
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        className='absolute inset-0 h-full w-full object-cover'
                        muted
                        playsInline
                      />
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
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className='border-t border-zinc-800 px-6 py-4'>
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
              Add{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogImportUserMedia;
export type { ImportedMedia };
