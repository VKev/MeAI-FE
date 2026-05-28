import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { StorageUsageByUserItem } from '@/models/admin-client.model';

type StorageUsageByUserTableProps = {
  users: StorageUsageByUserItem[];
  isLoading: boolean;
  namespace: string | null;
};

function formatBytes(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || (value ?? 0) <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value ?? 0;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatPercent(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return '-';
  }

  return `${Math.max(0, value ?? 0).toFixed(2)}%`;
}

function StorageUsageByUserTableComponent({ users, isLoading, namespace }: StorageUsageByUserTableProps) {
  const visibleUsers = useMemo(
    () => users.filter((user) => !(user.email?.toLowerCase().includes('admin') ?? false)),
    [users]
  );

  const hasRows = visibleUsers.length > 0;

  return (
    <div className='overflow-hidden rounded-xl border border-white/8 bg-[#13131e]'>
      <div className='flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-white'>Usage by User</p>
          <p className='text-xs text-slate-400'>
            {namespace ? `Namespace: ${namespace}` : 'All users in current namespace'}
          </p>
        </div>
        <Badge variant='secondary' className='border-white/10 bg-white/5 text-slate-200'>
          {visibleUsers.length.toLocaleString()} users
        </Badge>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-white/8'>
          <thead className='bg-[#1a1a24]'>
            <tr>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>User</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Plan</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Used</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Quota</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Available</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Usage</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Resources</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Status</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/6'>
            {isLoading && (
              <tr>
                <td colSpan={8} className='px-4 py-12 text-center text-sm text-slate-400'>
                  Loading user usage...
                </td>
              </tr>
            )}

            {!isLoading && !hasRows && (
              <tr>
                <td colSpan={8} className='px-4 py-12 text-center text-sm text-slate-400'>
                  No user usage data available.
                </td>
              </tr>
            )}

            {!isLoading &&
              visibleUsers.map((user) => (
                <tr key={user.userId} className='hover:bg-white/2'>
                  <td className='px-4 py-3'>
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-sm font-medium text-white'>
                        {user.email || user.username || user.userId}
                      </span>
                      <span className='text-xs text-slate-500'>{user.userId}</span>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-300'>{user.subscriptionName || '-'}</td>
                  <td className='px-4 py-3 text-sm text-slate-200'>{formatBytes(user.usedBytes)}</td>
                  <td className='px-4 py-3 text-sm text-slate-200'>
                    {user.quotaBytes === null ? 'Unlimited' : formatBytes(user.quotaBytes)}
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-200'>
                    {user.availableBytes === null ? '-' : formatBytes(user.availableBytes)}
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-200'>{formatPercent(user.usagePercent)}</td>
                  <td className='px-4 py-3 text-sm text-slate-200'>{user.resourceCount.toLocaleString()}</td>
                  <td className='px-4 py-3'>
                    <Badge
                      className={
                        user.isOverQuota
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }
                    >
                      {user.isOverQuota ? 'Over quota' : 'Healthy'}
                    </Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const StorageUsageByUserTable = memo(StorageUsageByUserTableComponent);
