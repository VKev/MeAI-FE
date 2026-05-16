import { memo } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ApiKeyFilterStatus = 'all' | 'active' | 'inactive';

export type ApiKeyFilters = {
  provider: string;
  keyName: string;
  status: ApiKeyFilterStatus;
};

type ApiKeyFilterBarProps = {
  filters: ApiKeyFilters;
  providerOptions: string[];
  isLoading: boolean;
  onProviderChange: (value: string) => void;
  onKeyNameChange: (value: string) => void;
  onStatusChange: (value: ApiKeyFilterStatus) => void;
  onApply: () => void;
  onReset: () => void;
};

function ApiKeyFilterBarComponent({
  filters,
  providerOptions,
  isLoading,
  onProviderChange,
  onKeyNameChange,
  onStatusChange,
  onApply,
  onReset
}: ApiKeyFilterBarProps) {
  return (
    <div className='rounded-xl border border-white/8 bg-[#13131e] p-4'>
      <div className='mb-3 flex items-center gap-2 text-slate-300'>
        <Filter className='size-4' />
        <span className='text-[13px] font-semibold'>Filters</span>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Provider</label>
          <select
            value={filters.provider}
            onChange={(event) => onProviderChange(event.target.value)}
            className='h-9 w-full rounded-md border border-white/8 bg-white/4 px-3 text-[13px] text-white outline-none transition-colors focus:border-violet-500/40'
          >
            <option value=''>All providers</option>
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Key Name</label>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500' />
            <Input
              value={filters.keyName}
              onChange={(event) => onKeyNameChange(event.target.value)}
              placeholder='ApiKey, SecretKey...'
              className='h-9 border-white/8 bg-white/4 pl-8 text-[13px] text-white focus:border-violet-500/40'
            />
          </div>
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Status</label>
          <select
            value={filters.status}
            onChange={(event) => onStatusChange(event.target.value as ApiKeyFilterStatus)}
            className='h-9 w-full rounded-md border border-white/8 bg-white/4 px-3 text-[13px] text-white outline-none transition-colors focus:border-violet-500/40'
          >
            <option value='all'>All</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>

        <div className='flex items-end gap-2'>
          <Button
            type='button'
            onClick={onApply}
            disabled={isLoading}
            className='h-9 flex-1 bg-violet-600 text-[13px] font-medium text-white hover:bg-violet-700'
          >
            Apply
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onReset}
            disabled={isLoading}
            className='h-9 border-white/10 bg-transparent px-3 text-slate-300 hover:bg-white/5 hover:text-white'
          >
            <RotateCcw className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ApiKeyFilterBar = memo(ApiKeyFilterBarComponent);
