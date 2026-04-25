import { memo } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type StorageSettingsPanelsProps = {
  freeTierQuotaInput: string;
  systemQuotaInput: string;
  isSavingFreeTier: boolean;
  isSavingSystem: boolean;
  onFreeTierQuotaChange: (value: string) => void;
  onSystemQuotaChange: (value: string) => void;
  onSaveFreeTier: () => void;
  onSaveSystem: () => void;
};

function StorageSettingsPanelsComponent({
  freeTierQuotaInput,
  systemQuotaInput,
  isSavingFreeTier,
  isSavingSystem,
  onFreeTierQuotaChange,
  onSystemQuotaChange,
  onSaveFreeTier,
  onSaveSystem
}: StorageSettingsPanelsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      <div className='rounded-xl border border-cyan-500/20 bg-[#13131e] p-4'>
        <p className='mb-1 text-sm font-semibold text-white'>Free Tier Storage Quota</p>
        <p className='mb-3 text-xs text-slate-400'>
          Set the default quota for users without an active subscription plan.
        </p>

        <div className='flex items-end gap-2'>
          <div className='flex-1'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Bytes</label>
            <Input
              type='number'
              min='0'
              value={freeTierQuotaInput}
              onChange={(event) => onFreeTierQuotaChange(event.target.value)}
              className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
            />
          </div>
          <Button
            type='button'
            onClick={onSaveFreeTier}
            disabled={isSavingFreeTier}
            className='h-9 bg-cyan-600 text-white hover:bg-cyan-700'
          >
            <Save className='size-4' /> Save
          </Button>
        </div>
      </div>

      <div className='rounded-xl border border-indigo-500/20 bg-[#13131e] p-4'>
        <p className='mb-1 text-sm font-semibold text-white'>System-Wide Storage Quota</p>
        <p className='mb-3 text-xs text-slate-400'>
          Set total capacity for the whole platform. Leave empty to make it unlimited.
        </p>

        <div className='flex items-end gap-2'>
          <div className='flex-1'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Bytes (empty = unlimited)</label>
            <Input
              type='number'
              min='0'
              value={systemQuotaInput}
              onChange={(event) => onSystemQuotaChange(event.target.value)}
              className='h-9 border-white/8 bg-white/4 text-white focus:border-indigo-500/40'
            />
          </div>
          <Button
            type='button'
            onClick={onSaveSystem}
            disabled={isSavingSystem}
            className='h-9 bg-indigo-600 text-white hover:bg-indigo-700'
          >
            <Save className='size-4' /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export const StorageSettingsPanels = memo(StorageSettingsPanelsComponent);
