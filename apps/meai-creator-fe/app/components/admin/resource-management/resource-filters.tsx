import { memo } from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ResourceFilterValues = {
  userId: string;
  workspaceId: string;
  namespace: string;
  resourceType: 'all' | 'image' | 'video';
  includeDeleted: boolean;
};

type ResourceFiltersProps = {
  filters: ResourceFilterValues;
  isLoading: boolean;
  onFilterChange: <K extends keyof ResourceFilterValues>(key: K, value: ResourceFilterValues[K]) => void;
  onApply: () => void;
  onReset: () => void;
};

function ResourceFiltersComponent({ filters, isLoading, onFilterChange, onApply, onReset }: ResourceFiltersProps) {
  return (
    <div className='rounded-xl border border-white/8 bg-[#13131e] p-4'>
      <div className='mb-4 flex items-center gap-2 text-slate-300'>
        <Filter className='size-4' />
        <p className='text-[13px] font-semibold'>Resource Filters</p>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
        <div>
          <label className='mb-1.5 block text-[12px] text-slate-400'>User ID</label>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500' />
            <Input
              value={filters.userId}
              onChange={(event) => onFilterChange('userId', event.target.value)}
              placeholder='Filter by user id'
              className='h-9 border-white/8 bg-white/4 pl-8 text-white focus:border-cyan-500/40'
            />
          </div>
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] text-slate-400'>Workspace ID</label>
          <Input
            value={filters.workspaceId}
            onChange={(event) => onFilterChange('workspaceId', event.target.value)}
            placeholder='Filter by workspace id'
            className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
          />
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] text-slate-400'>Namespace</label>
          <Input
            value={filters.namespace}
            onChange={(event) => onFilterChange('namespace', event.target.value)}
            placeholder='Filter by namespace'
            className='h-9 border-white/8 bg-white/4 text-white focus:border-cyan-500/40'
          />
        </div>

        <div>
          <label className='mb-1.5 block text-[12px] text-slate-400'>Resource Type</label>
          <select
            value={filters.resourceType}
            onChange={(event) =>
              onFilterChange('resourceType', event.target.value as ResourceFilterValues['resourceType'])
            }
            className='h-9 w-full rounded-md border border-white/8 bg-white/4 px-3 text-[13px] text-white outline-none focus:border-cyan-500/40'
          >
            <option value='all'>All</option>
            <option value='image'>Image</option>
            <option value='video'>Video</option>
          </select>
        </div>

        <div className='flex items-end gap-2'>
          <Button
            type='button'
            onClick={onApply}
            disabled={isLoading}
            className='h-9 flex-1 bg-violet-600 text-white hover:bg-violet-700'
          >
            Apply
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onReset}
            disabled={isLoading}
            className='h-9 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white'
          >
            Reset
          </Button>
        </div>
      </div>

      <label className='mt-3 inline-flex cursor-pointer items-center gap-2 text-[12px] text-slate-400'>
        <input
          type='checkbox'
          checked={filters.includeDeleted}
          onChange={(event) => onFilterChange('includeDeleted', event.target.checked)}
          className='size-4 accent-violet-500'
        />
        Include soft-deleted resources
      </label>
    </div>
  );
}

export const ResourceFilters = memo(ResourceFiltersComponent);
