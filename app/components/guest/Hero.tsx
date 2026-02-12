import { Link } from 'react-router';
import { ArrowRight, CirclePlay, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className='relative overflow-hidden border-b border-white/6 pt-28 md:pt-36 pb-24 md:pb-28'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-20' />
        <div className='absolute left-1/2 top-8 h-[520px] w-[1040px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,84,255,0.24),rgba(143,84,255,0)_70%)] blur-2xl' />
        <div className='absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.15),rgba(236,72,153,0)_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
        <div className='mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#11111a]/70 px-3 py-1.5 text-xs font-medium text-white/75'>
          <Zap className='h-3.5 w-3.5 fill-current text-[#d66bff]' />
          <span>MeAI v2.0 is live</span>
        </div>

        <div className='relative z-20 mx-auto max-w-5xl text-center'>
          <h1 className='text-5xl leading-[0.95] tracking-[-0.03em] font-semibold text-white sm:text-6xl md:text-8xl'>
            <span className='block mb-2'>Marketing</span>
            <span className='block text-gradient-primary'>Automation, Unleashed</span>
          </h1>
          <p className='mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/60 md:text-2xl'>
            Create, distribute, and automate your content across all channels. Let AI handle everything from video
            creation to multi-platform publishing.
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link
              to='/auth/sign-in'
              className='group flex items-center gap-3 rounded-full bg-white px-9 py-4 text-base font-semibold text-black transition-transform hover:-translate-y-0.5 md:text-lg'
            >
              Start Creating Free
              <ArrowRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
            </Link>
            <a
              href='#workflow'
              className='flex items-center gap-3 rounded-full border border-white/18 px-9 py-4 text-base font-semibold text-white hover:bg-white/6 transition-colors md:text-lg'
            >
              <CirclePlay className='h-5 w-5 text-white/80' />
              Watch Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
