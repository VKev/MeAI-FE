import { Button } from '@/components/ui/button';
import { CreditCardIcon, RefreshCw } from 'lucide-react';
import React from 'react';

function UserCard() {
  return (
    <>
      <div className='space-y-10'>
        <section className='mb-10 flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <CreditCardIcon className='h-7 w-7' />
            </div>
            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Payment Cards</h1>
              <p className='text-sm leading-relaxed text-slate-400'>View and manage your saved payment methods.</p>
            </div>
          </div>
          <Button
            variant='outline'
            size={'lg'}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
            // onClick={() => refetch()}
          >
            <RefreshCw className={`size-4 ${false ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </section>
      </div>
    </>
  );
}

export default UserCard;
