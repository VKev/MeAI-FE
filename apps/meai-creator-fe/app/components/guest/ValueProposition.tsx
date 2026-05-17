import { ArrowRight, CheckCircle2 } from 'lucide-react';

const points = ['10x Faster Content Production', 'Brand Voice Adaptation', 'Multi-Channel Auto-Posting'];

export function ValueProposition() {
  return (
    <section className='relative border-b border-white/6 py-20 overflow-hidden'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-16' />
        <div className='absolute left-1/2 top-10 h-[420px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,50,167,0.2),rgba(91,50,167,0)_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[48%_52%]'>
        <div>
          <h2 className='text-4xl leading-[0.95] tracking-[-0.03em] font-semibold text-white md:text-7xl'>
            Transform your
            <br />
            <span className='text-gradient-primary'>entire workflow</span>
          </h2>
          <p className='mt-8 max-w-xl text-lg leading-relaxed text-white/52 md:text-3xl'>
            Stop juggling 10 different tools. MeAI unifies generation, scheduling, and analytics into one seamless
            command center.
          </p>

          <ul className='mt-9 space-y-5'>
            {points.map((point) => (
              <li key={point} className='flex items-center gap-3 text-lg font-semibold text-white/88 md:text-3xl'>
                <span className='flex h-6 w-6 items-center justify-center rounded-full bg-[#7a2fd0]/33 text-[#cf77ff]'>
                  <CheckCircle2 className='h-4 w-4' />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <button
            type='button'
            className='mt-10 inline-flex items-center gap-2 border-b border-white/25 pb-2 text-lg font-semibold text-white md:text-2xl'
          >
            Explore all features
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>

        <article className='rounded-[30px] border border-white/12 bg-[#090a0f]/90 p-6 md:p-7'>
          <h3 className='text-3xl font-semibold text-white md:text-5xl'>Smart Scheduler</h3>
          <p className='mt-2 text-lg text-white/52 md:text-2xl'>Drag & drop calendar for all your social accounts.</p>

          <div className='mt-6 rounded-2xl border border-white/12 bg-black/25 p-2'>
            <div className='relative overflow-hidden rounded-xl border border-white/10 bg-[#05060b] p-2'>
              <div className='grid grid-cols-5 text-center text-xs text-white/28 md:text-sm'>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className='border-b border-white/6 py-2'>
                    {day}
                  </div>
                ))}
              </div>

              <div className='relative grid grid-cols-5'>
                {Array.from({ length: 25 }).map((_, idx) => (
                  <div key={idx} className='h-12 border-r border-b border-white/6 last:border-r-0' />
                ))}

                <div className='absolute left-[4%] top-[14%] h-20 w-[80px] rounded-xl border border-[#00d4ff]/35 bg-[#00d4ff]/14' />
                <div className='absolute left-[23%] top-[25%] h-20 w-[80px] rounded-xl border border-[#b24cff]/35 bg-[#b24cff]/17' />
                <div className='absolute left-[42%] top-0 h-full w-[80px] bg-[linear-gradient(180deg,rgba(209,122,255,0.14),rgba(209,122,255,0.04),rgba(209,122,255,0.14))]' />
                <div className='absolute left-[44%] top-[45%] w-[82px] rounded-lg bg-[#ea84ff] px-2 py-1.5 shadow-[0_0_24px_rgba(238,122,255,0.45)]'>
                  <div className='h-1.5 w-6 rounded-full bg-[#5d4380]/45' />
                  <div className='mt-1 h-1.5 w-9 rounded-full bg-[#5d4380]/45' />
                </div>
                <div className='absolute left-[82%] top-[14%] h-20 w-[80px] rounded-xl border border-[#5f68ff]/35 bg-[#5f68ff]/18' />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
