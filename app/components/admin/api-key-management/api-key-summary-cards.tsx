import { memo } from 'react';
import { CheckCircle2, KeyRound, ShieldOff } from 'lucide-react';

type ApiKeySummaryCardsProps = {
  total: number;
  active: number;
  inactive: number;
};

function ApiKeySummaryCardsComponent({ total, active, inactive }: ApiKeySummaryCardsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <div className='relative overflow-hidden rounded-xl border border-violet-500/20 bg-[#13131e] p-5'>
        <div className='mb-3 flex items-center gap-2'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300'>
            <KeyRound className='size-5' />
          </div>
          <p className='text-[13px] font-medium text-slate-400'>Total Keys</p>
        </div>
        <p className='text-[26px] font-bold tracking-tight text-white'>{total}</p>
      </div>

      <div className='relative overflow-hidden rounded-xl border border-emerald-500/20 bg-[#13131e] p-5'>
        <div className='mb-3 flex items-center gap-2'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300'>
            <CheckCircle2 className='size-5' />
          </div>
          <p className='text-[13px] font-medium text-slate-400'>Active Keys</p>
        </div>
        <p className='text-[26px] font-bold tracking-tight text-white'>{active}</p>
      </div>

      <div className='relative overflow-hidden rounded-xl border border-amber-500/20 bg-[#13131e] p-5 sm:col-span-2 lg:col-span-1'>
        <div className='mb-3 flex items-center gap-2'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300'>
            <ShieldOff className='size-5' />
          </div>
          <p className='text-[13px] font-medium text-slate-400'>Inactive Keys</p>
        </div>
        <p className='text-[26px] font-bold tracking-tight text-white'>{inactive}</p>
      </div>
    </div>
  );
}

export const ApiKeySummaryCards = memo(ApiKeySummaryCardsComponent);
