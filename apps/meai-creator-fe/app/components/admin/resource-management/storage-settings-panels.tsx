import { memo } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type QuotaUnit = 'MB' | 'GB';

type StorageSettingsPanelsProps = {
  freeTierQuotaInput: string;
  systemQuotaInput: string;
  freeTierQuotaUnit: QuotaUnit;
  systemQuotaUnit: QuotaUnit;
  isSavingFreeTier: boolean;
  isSavingSystem: boolean;
  onFreeTierQuotaChange: (value: string) => void;
  onSystemQuotaChange: (value: string) => void;
  onFreeTierQuotaUnitChange: (value: QuotaUnit) => void;
  onSystemQuotaUnitChange: (value: QuotaUnit) => void;
  onSaveFreeTier: () => void;
  onSaveSystem: () => void;
};

function StorageSettingsPanelsComponent({
  freeTierQuotaInput,
  systemQuotaInput,
  freeTierQuotaUnit,
  systemQuotaUnit,
  isSavingFreeTier,
  isSavingSystem,
  onFreeTierQuotaChange,
  onSystemQuotaChange,
  onFreeTierQuotaUnitChange,
  onSystemQuotaUnitChange,
  onSaveFreeTier,
  onSaveSystem
}: StorageSettingsPanelsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      <div className='rounded-xl border border-violet-500/20 bg-[#13131e] p-4'>
        <p className='mb-1 text-sm font-semibold text-white'>Free Tier Storage Quota</p>
        <p className='mb-3 text-xs text-slate-400'>
          Set the default quota for users without an active subscription plan.
        </p>

        <div className='flex items-end gap-2'>
          <div className='flex-1'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Quota</label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={freeTierQuotaInput}
              onChange={(event) => onFreeTierQuotaChange(event.target.value)}
              className='h-9 border-white/8 bg-white/4 text-white focus:border-violet-500/40'
            />
          </div>
          <div className='w-22'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Unit</label>
            <Select
              value={freeTierQuotaUnit}
              onValueChange={(val) => onFreeTierQuotaUnitChange(val as QuotaUnit)}
            >
              <SelectTrigger className='flex h-9 w-full items-center justify-between rounded-md border border-white/8 bg-white/4 px-3 text-sm text-white hover:bg-white/8 focus:border-violet-500/40 focus:outline-hidden outline-hidden'>
                <SelectValue placeholder={freeTierQuotaUnit} />
              </SelectTrigger>
              <SelectContent className='border-white/8 bg-[#13131e] text-white'>
                <SelectItem
                  value='MB'
                  className='cursor-pointer text-sm focus:bg-[#1f1f2e] focus:text-white'
                >
                  MB
                </SelectItem>
                <SelectItem
                  value='GB'
                  className='cursor-pointer text-sm focus:bg-[#1f1f2e] focus:text-white'
                >
                  GB
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type='button'
            onClick={onSaveFreeTier}
            disabled={isSavingFreeTier}
            className='h-9 bg-violet-600 text-white hover:bg-violet-700'
          >
            <Save className='size-4' /> Save
          </Button>
        </div>
      </div>

      <div className='rounded-xl border border-violet-500/20 bg-[#13131e] p-4'>
        <p className='mb-1 text-sm font-semibold text-white'>System-Wide Storage Quota</p>
        <p className='mb-3 text-xs text-slate-400'>
          Set total capacity for the whole platform. Leave empty to make it unlimited.
        </p>

        <div className='flex items-end gap-2'>
          <div className='flex-1'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Quota (empty = unlimited)</label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={systemQuotaInput}
              onChange={(event) => onSystemQuotaChange(event.target.value)}
              className='h-9 border-white/8 bg-white/4 text-white focus:border-violet-500/40'
            />
          </div>
          <div className='w-22'>
            <label className='mb-1.5 block text-[12px] text-slate-400'>Unit</label>
            <Select
              value={systemQuotaUnit}
              onValueChange={(val) => onSystemQuotaUnitChange(val as QuotaUnit)}
            >
              <SelectTrigger className='flex h-9 w-full items-center justify-between rounded-md border border-white/8 bg-white/4 px-3 text-sm text-white hover:bg-white/8 focus:border-violet-500/40 focus:outline-hidden outline-hidden'>
                <SelectValue placeholder={systemQuotaUnit} />
              </SelectTrigger>
              <SelectContent className='border-white/8 bg-[#13131e] text-white'>
                <SelectItem
                  value='MB'
                  className='cursor-pointer text-sm focus:bg-[#1f1f2e] focus:text-white'
                >
                  MB
                </SelectItem>
                <SelectItem
                  value='GB'
                  className='cursor-pointer text-sm focus:bg-[#1f1f2e] focus:text-white'
                >
                  GB
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type='button'
            onClick={onSaveSystem}
            disabled={isSavingSystem}
            className='h-9 bg-violet-600 text-white hover:bg-violet-700'
          >
            <Save className='size-4' /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export const StorageSettingsPanels = memo(StorageSettingsPanelsComponent);
