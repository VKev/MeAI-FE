import { memo, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StorageResourceItem } from '@/models/admin-client.model';

const PAGE_SIZE = 10;

type ResourceTableProps = {
  items: StorageResourceItem[];
  isLoading: boolean;
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function ResourceTableComponent({ items, isLoading }: ResourceTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / PAGE_SIZE)), [items.length]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return (
    <div className='overflow-hidden rounded-xl border border-white/8 bg-[#13131e]'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-white/8'>
          <thead className='bg-[#1a1a24]'>
            <tr>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Type</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Content Type</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Size</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>User ID</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Workspace ID</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Namespace</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Storage Key</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Created At</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Deleted At</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/6'>
            {isLoading && (
              <tr>
                <td colSpan={9} className='px-4 py-12 text-center text-sm text-slate-400'>
                  Loading storage resources...
                </td>
              </tr>
            )}

            {!isLoading && pagedItems.length === 0 && (
              <tr>
                <td colSpan={9} className='px-4 py-12 text-center text-sm text-slate-400'>
                  No resources matched your filters.
                </td>
              </tr>
            )}

            {!isLoading &&
              pagedItems.map((item) => (
                <tr key={item.id} className='hover:bg-white/2'>
                  <td className='px-4 py-3 text-[13px] text-slate-200'>
                    <Badge
                      className={
                        item.resourceType === 'video'
                          ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      }
                    >
                      {item.resourceType || '-'}
                    </Badge>
                  </td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{item.contentType || '-'}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-200'>{formatBytes(item.sizeBytes)}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{item.userId}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{item.workspaceId || '-'}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{item.storageNamespace || '-'}</td>
                  <td className='max-w-60 truncate px-4 py-3 text-[13px] text-slate-300' title={item.storageKey || '-'}>
                    {item.storageKey || '-'}
                  </td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{formatDate(item.createdAt)}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{formatDate(item.deletedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length > PAGE_SIZE && (
        <div className='flex items-center justify-between border-t border-white/8 px-4 py-3'>
          <p className='text-[12px] text-slate-400'>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, items.length)} of {items.length} items
          </p>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            >
              Previous
            </Button>
            <span className='text-[12px] text-slate-300'>
              Page {page} / {totalPages}
            </span>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ResourceTable = memo(ResourceTableComponent);
