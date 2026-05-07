import { Button } from '@/components/ui/button';
import { BotIcon, PlusIcon, RefreshCcw } from 'lucide-react';

function AiContentAutomation() {
  return (
    <>
      <div>
        <section className='flex items-center justify-between overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <BotIcon className='h-7 w-7' />
            </div>

            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>AI Auto Posting</h1>
              <p className='text-sm leading-relaxed text-slate-400'>Manage your AI auto posting requests</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              // onClick={() => void refetch()}
              className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
            >
              <RefreshCcw className={`h-4 w-4`} />
              Sync Now
            </Button>
            <Button
              type='button'
              variant='default'
              // onClick={() => void refetch()}
              className='rounded-2xl bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30'
            >
              <PlusIcon className={`h-4 w-4`} />
              New Request
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

export default AiContentAutomation;
