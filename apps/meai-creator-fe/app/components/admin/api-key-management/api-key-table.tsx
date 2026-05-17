import { memo, useEffect, useMemo, useState } from 'react';
import { Edit, Loader2, MoreHorizontal, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { ApiCredentialItem } from '@/models/admin-client.model';

const statusClassName: Record<'active' | 'inactive', string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  inactive: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
};

type ApiKeyTableProps = {
  items: ApiCredentialItem[];
  isLoading: boolean;
  togglingId: string | null;
  onEdit: (item: ApiCredentialItem) => void;
  onDisable: (item: ApiCredentialItem) => void;
};

const PAGE_SIZE = 10;

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function ApiKeyTableComponent({ items, isLoading, togglingId, onEdit, onDisable }: ApiKeyTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / PAGE_SIZE)), [items.length]);

  useEffect(() => {
    setPage(1);
  }, [items]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className='overflow-hidden rounded-xl border border-white/8 bg-[#13131e]'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-white/8'>
          <thead className='bg-[#1a1a24]'>
            <tr>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Provider</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Key Name</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Display Name</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Masked Value</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Status</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Source</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Version</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Last Rotated</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>
                Last Synced Env
              </th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Updated At</th>
              <th className='px-4 py-3 text-right text-[11px] uppercase tracking-wider text-slate-500'>Actions</th>
            </tr>
          </thead>

          <tbody className='divide-y divide-white/6'>
            {isLoading && (
              <tr>
                <td colSpan={11} className='px-4 py-14 text-center text-slate-400'>
                  <div className='inline-flex items-center gap-2 text-[13px]'>
                    <Loader2 className='size-4 animate-spin text-violet-300' /> Loading API keys...
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={11} className='px-4 py-14 text-center text-[13px] text-slate-400'>
                  No API key records found.
                </td>
              </tr>
            )}

            {!isLoading &&
              pagedItems.map((item) => {
                const status = item.isActive ? 'active' : 'inactive';
                const isTogglingRow = togglingId === item.id;

                return (
                  <tr key={item.id} className='group hover:bg-white/2'>
                    <td className='px-4 py-3 text-[13px] font-medium text-white'>{item.provider}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-200'>{item.keyName}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-300'>{item.displayName || '-'}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-200'>{item.maskedValue || '-'}</td>
                    <td className='px-4 py-3'>
                      <Badge className={statusClassName[status]}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className='px-4 py-3 text-[13px] capitalize text-slate-300'>
                      {item.source.replace(/_/g, ' ')}
                    </td>
                    <td className='px-4 py-3 text-[13px] text-slate-300'>{item.version}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-300'>{formatDate(item.lastRotatedAt)}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-300'>{formatDate(item.lastSyncedFromEnvAt)}</td>
                    <td className='px-4 py-3 text-[13px] text-slate-300'>{formatDate(item.updatedAt)}</td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              size='icon-sm'
                              variant='ghost'
                              className='h-8 w-8 text-slate-300 transition-colors duration-200 data-[state=open]:bg-white/10 data-[state=open]:text-white hover:bg-white/10 hover:text-white'
                            >
                              {isTogglingRow ? (
                                <Loader2 className='size-3.5 animate-spin' />
                              ) : (
                                <MoreHorizontal className='size-4' />
                              )}
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align='end'
                            className='w-36 border border-white/10 bg-[#151522] text-slate-200'
                          >
                            <DropdownMenuItem onClick={() => onEdit(item)} className='cursor-pointer'>
                              <Edit className='size-3.5' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant='destructive'
                              disabled={!item.isActive || isTogglingRow}
                              onClick={() => onDisable(item)}
                              className='cursor-pointer'
                            >
                              <ShieldOff className='size-3.5' />
                              Disable
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length > PAGE_SIZE && (
        <div className='flex items-center justify-between border-t border-white/8 px-4 py-3'>
          <p className='text-[12px] text-slate-400'>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, items.length)} of {items.length} keys
          </p>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!canGoPrev}
              className='h-8 border-white/10 bg-transparent px-3 text-slate-300 hover:bg-white/5 hover:text-white'
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
              disabled={!canGoNext}
              className='h-8 border-white/10 bg-transparent px-3 text-slate-300 hover:bg-white/5 hover:text-white'
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ApiKeyTable = memo(ApiKeyTableComponent);
