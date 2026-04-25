import { memo } from 'react';
import { Database, HardDrive, TriangleAlert, Users } from 'lucide-react';

type ResourceSummaryCardsProps = {
  totalResources: number;
  totalUsedBytes: number;
  totalReservedBytes: number;
  overQuotaUsers: number;
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

function ResourceSummaryCardsComponent({
  totalResources,
  totalUsedBytes,
  totalReservedBytes,
  overQuotaUsers
}: ResourceSummaryCardsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <div className='rounded-xl border border-cyan-500/20 bg-[#13131e] p-5'>
        <div className='mb-2 flex items-center gap-2 text-slate-400'>
          <Database className='size-4 text-cyan-300' />
          <span className='text-[12px] uppercase tracking-wide'>Total Resources</span>
        </div>
        <p className='text-2xl font-bold text-white'>{totalResources.toLocaleString()}</p>
      </div>

      <div className='rounded-xl border border-emerald-500/20 bg-[#13131e] p-5'>
        <div className='mb-2 flex items-center gap-2 text-slate-400'>
          <HardDrive className='size-4 text-emerald-300' />
          <span className='text-[12px] uppercase tracking-wide'>Used Storage</span>
        </div>
        <p className='text-2xl font-bold text-white'>{formatBytes(totalUsedBytes)}</p>
      </div>

      <div className='rounded-xl border border-amber-500/20 bg-[#13131e] p-5'>
        <div className='mb-2 flex items-center gap-2 text-slate-400'>
          <Users className='size-4 text-amber-300' />
          <span className='text-[12px] uppercase tracking-wide'>Reserved Storage</span>
        </div>
        <p className='text-2xl font-bold text-white'>{formatBytes(totalReservedBytes)}</p>
      </div>

      <div className='rounded-xl border border-red-500/20 bg-[#13131e] p-5'>
        <div className='mb-2 flex items-center gap-2 text-slate-400'>
          <TriangleAlert className='size-4 text-red-300' />
          <span className='text-[12px] uppercase tracking-wide'>Over Quota Users</span>
        </div>
        <p className='text-2xl font-bold text-white'>{overQuotaUsers.toLocaleString()}</p>
      </div>
    </div>
  );
}

export const ResourceSummaryCards = memo(ResourceSummaryCardsComponent);
