import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className='relative border-b border-white/6 py-20 overflow-hidden'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(70,36,132,0.28),rgba(70,36,132,0)_72%)]' />
        <div className='absolute inset-0 landing-grid opacity-12' />
      </div>

      <div className='relative mx-auto w-full max-w-[920px] px-4 text-center sm:px-6'>
        <div className='mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/82'>
          <div className='flex -space-x-2'>
            {['/logo.png', '/logo.png', '/logo.png', '/logo.png'].map((avatar, idx) => (
              <img
                key={idx}
                src={avatar}
                alt='Creator avatar'
                className='h-7 w-7 rounded-full border border-[#11121a] object-cover'
              />
            ))}
            <span className='inline-flex h-7 items-center rounded-full bg-[#a94cff] px-2 text-[11px] font-semibold text-white'>
              18k+
            </span>
          </div>
          <span className='text-sm md:text-xl'>creators already using MeAI</span>
        </div>

        <h2 className='text-4xl leading-[0.95] tracking-[-0.03em] font-semibold text-white md:text-7xl'>
          Ready to Transform Your
          <br />
          <span className='text-gradient-primary'>Content Strategy?</span>
        </h2>

        <p className='mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-white/50 md:text-2xl'>
          Join thousands of creators and businesses using AI to automate their marketing. Start your free trial today.
        </p>

        <div className='mt-10 flex justify-center'>
          <button
            type='button'
            className='group flex items-center gap-3 rounded-full bg-[linear-gradient(90deg,#7b56ff_0%,#f552a9_100%)] px-9 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(173,88,255,0.35)] md:text-2xl'
          >
            <Sparkles className='h-5 w-5' />
            Start Creating for Free
            <ArrowRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
          </button>
        </div>

        <div className='mt-7 flex flex-wrap items-center justify-center gap-7 text-sm text-white/52 md:text-lg'>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-[#31d474]' />
            14-day free trial
          </span>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-[#31d474]' />
            No credit card required
          </span>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-[#31d474]' />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
