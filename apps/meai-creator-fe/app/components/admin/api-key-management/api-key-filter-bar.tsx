import { memo } from 'react';
import { Filter, RotateCcw, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-full justify-between border-white/8 bg-white/4 px-3 text-[13px] font-normal text-white hover:bg-white/10 hover:text-white focus:border-violet-500/40'
              >
                <span className='truncate'>{filters.provider || 'All providers'}</span>
                <ChevronDown className='ml-2 size-4 shrink-0 text-slate-400' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
              className='min-w-32 border-white/8 bg-[#1a1a24] text-white'
            >
              <DropdownMenuItem
                className='cursor-pointer text-[13px] hover:bg-white/5 focus:bg-white/5'
                onClick={() => onProviderChange('')}
              >
                All providers
              </DropdownMenuItem>
              {providerOptions.map((provider) => (
                <DropdownMenuItem
                  key={provider}
                  className='cursor-pointer text-[13px] hover:bg-white/5 focus:bg-white/5'
                  onClick={() => onProviderChange(provider)}
                >
                  {provider}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Key Name</label>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500' />
            <Input
              value={filters.keyName}
              onChange={(event) => onKeyNameChange(event.target.value.trim())}
              placeholder='ApiKey, SecretKey...'
              className='h-9 border-white/8 bg-white/4 pl-8 text-[13px] text-white focus:border-violet-500/40'
            />
          </div>
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-slate-400'>Status</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-full justify-between border-white/8 bg-white/4 px-3 text-[13px] font-normal text-white hover:bg-white/10 hover:text-white focus:border-violet-500/40'
              >
                <span className='capitalize'>{filters.status}</span>
                <ChevronDown className='ml-2 size-4 shrink-0 text-slate-400' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
              className='min-w-32 border-white/8 bg-[#1a1a24] text-white'
            >
              <DropdownMenuItem
                className='cursor-pointer text-[13px] hover:bg-white/5 focus:bg-white/5'
                onClick={() => onStatusChange('all')}
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer text-[13px] hover:bg-white/5 focus:bg-white/5'
                onClick={() => onStatusChange('active')}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer text-[13px] hover:bg-white/5 focus:bg-white/5'
                onClick={() => onStatusChange('inactive')}
              >
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
