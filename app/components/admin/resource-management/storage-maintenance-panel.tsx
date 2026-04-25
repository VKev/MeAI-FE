import { memo } from 'react';
import { Activity, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StorageMaintenancePanelProps = {
  isRunningCleanup: boolean;
  isRunningReconcile: boolean;
  onRunCleanupDry: () => void;
  onRunCleanupExecute: () => void;
  onRunReconcileDry: () => void;
  onRunReconcileExecute: () => void;
};

function StorageMaintenancePanelComponent({
  isRunningCleanup,
  isRunningReconcile,
  onRunCleanupDry,
  onRunCleanupExecute,
  onRunReconcileDry,
  onRunReconcileExecute
}: StorageMaintenancePanelProps) {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      <div className='rounded-xl border border-amber-500/20 bg-[#13131e] p-4'>
        <div className='mb-3 flex items-center gap-2'>
          <Wrench className='size-4 text-amber-300' />
          <p className='text-sm font-semibold text-white'>Storage Cleanup</p>
        </div>
        <p className='mb-4 text-xs text-slate-400'>
          Remove expired resources and orphan objects inside the current namespace.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onRunCleanupDry}
            disabled={isRunningCleanup}
            className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
          >
            Dry Run
          </Button>
          <Button
            type='button'
            onClick={onRunCleanupExecute}
            disabled={isRunningCleanup}
            className='h-8 bg-amber-600 text-white hover:bg-amber-700'
          >
            Execute Cleanup
          </Button>
        </div>
      </div>

      <div className='rounded-xl border border-purple-500/20 bg-[#13131e] p-4'>
        <div className='mb-3 flex items-center gap-2'>
          <Activity className='size-4 text-purple-300' />
          <p className='text-sm font-semibold text-white'>Storage Reconcile</p>
        </div>
        <p className='mb-4 text-xs text-slate-400'>
          Compare metadata and storage objects after local database reset or drift.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onRunReconcileDry}
            disabled={isRunningReconcile}
            className='h-8 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
          >
            Dry Run
          </Button>
          <Button
            type='button'
            onClick={onRunReconcileExecute}
            disabled={isRunningReconcile}
            className='h-8 bg-purple-600 text-white hover:bg-purple-700'
          >
            Execute Reconcile
          </Button>
        </div>
      </div>
    </div>
  );
}

export const StorageMaintenancePanel = memo(StorageMaintenancePanelComponent);
