import { memo } from 'react';
import { Button } from '@/components/ui/button';
import type { StoragePlanPolicyItem } from '@/models/admin-client.model';
import { EditIcon } from 'lucide-react';

type StoragePlanTableProps = {
  plans: StoragePlanPolicyItem[];
  onEditPlan: (plan: StoragePlanPolicyItem) => void;
};

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPlanLimits(plan: StoragePlanPolicyItem) {
  const candidate = plan as unknown as Record<string, unknown>;
  const nestedLimits =
    candidate.limits && typeof candidate.limits === 'object'
      ? (candidate.limits as Record<string, unknown>)
      : undefined;

  const source = nestedLimits ?? candidate;

  return {
    storageQuotaBytes: parseNullableNumber(source.storageQuotaBytes),
    maxUploadFileBytes: parseNullableNumber(source.maxUploadFileBytes),
    retentionDaysAfterDelete: parseNullableNumber(source.retentionDaysAfterDelete)
  };
}

function formatBytes(value: number | null) {
  if (value === null) {
    return 'Unlimited';
  }

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

function StoragePlanTableComponent({ plans, onEditPlan }: StoragePlanTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-white/8 bg-[#13131e]'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-white/8'>
          <thead className='bg-[#1a1a24]'>
            <tr>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Plan</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>Storage Quota</th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>
                Max Upload/File
              </th>
              <th className='px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500'>
                Retention (Days)
              </th>
              <th className='px-4 py-3 text-right text-[11px] uppercase tracking-wider text-slate-500'>Action</th>
            </tr>
          </thead>

          <tbody className='divide-y divide-white/6'>
            {plans.length === 0 && (
              <tr>
                <td colSpan={5} className='px-4 py-12 text-center text-sm text-slate-400'>
                  No plan policies available.
                </td>
              </tr>
            )}

            {plans.map((plan) => {
              const limits = getPlanLimits(plan);

              return (
                <tr key={plan.id} className='hover:bg-white/2'>
                  <td className='px-4 py-3 text-[13px] font-medium text-white'>{plan.name}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{formatBytes(limits.storageQuotaBytes)}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>{formatBytes(limits.maxUploadFileBytes)}</td>
                  <td className='px-4 py-3 text-[13px] text-slate-300'>
                    {limits.retentionDaysAfterDelete ?? 'Default'}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <Button
                      type='button'
                      size='sm'
                      variant='default'
                      onClick={() => onEditPlan(plan)}
                      className='h-8 border-violet-500/20 bg-transparent text-violet-400 hover:bg-violet-500/10 hover:text-violet-500'
                    >
                      <EditIcon className='size-4' />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const StoragePlanTable = memo(StoragePlanTableComponent);
