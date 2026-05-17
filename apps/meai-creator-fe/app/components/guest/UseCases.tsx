const creatorPipeline = ['Import raw clips', 'Auto-generate cuts + captions', 'Export platform-ready reels'];

const marketingBars = [34, 46, 58, 66, 52, 72];

const smallBusinessOutcomes = ['No editor needed', 'Brand-safe templates', 'Lower monthly ad cost'];

const agencyHighlights = [
  { label: 'Client capacity', value: '3x' },
  { label: 'Reporting speed', value: '5x faster' },
  { label: 'Avg margin lift', value: '+28%' }
];

export function UseCases() {
  return (
    <section id='use-cases' className='relative overflow-hidden border-b border-white/6 pt-10 pb-20 md:pt-12'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-14' />
        <div className='absolute left-0 top-10 h-[420px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(191,94,255,0.17),rgba(191,94,255,0)_70%)] blur-3xl' />
        <div className='absolute right-0 top-0 h-[420px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(74,132,255,0.12),rgba(74,132,255,0)_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-white/88'>
            USE CASES
          </div>
          <h2 className='mt-5 text-4xl leading-tight tracking-[-0.025em] font-semibold text-white md:text-6xl'>
            Built for <span className='text-gradient-primary'>Every Creator</span>
          </h2>
          <p className='mx-auto mt-4 max-w-3xl text-lg text-white/44 md:text-2xl'>
            Whether you&apos;re a solo creator or an enterprise team, MeAI scales with your specific needs.
          </p>
        </div>

        <div className='mt-12 grid gap-6 xl:grid-cols-12'>
          <article className='relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(155deg,#140f1d_0%,#0a0c14_58%,#090910_100%)] p-6 md:p-7 xl:col-span-6'>
            <div className='flex items-start justify-between gap-4'>
              <span className='rounded-full border border-[#bf69ff]/25 bg-[#3b1655]/45 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#df9dff] uppercase'>
                Creator Vertical
              </span>
              <span className='rounded-full border border-[#df8dff]/25 bg-[#3b1655]/55 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#e7a6ff] uppercase'>
                Most used
              </span>
            </div>

            <h3 className='mt-6 text-4xl leading-[1.06] tracking-[-0.02em] font-semibold text-white'>
              Content Creators
            </h3>
            <p className='mt-3 max-w-[46ch] text-base leading-relaxed text-white/52 md:text-lg'>
              Run idea-to-publish in one place and keep a daily posting cadence without adding headcount.
            </p>

            <div className='mt-6 rounded-2xl border border-white/10 bg-black/28 p-4'>
              <div className='flex items-center justify-between text-[11px] text-white/55'>
                <span>Creator pipeline</span>
                <span className='inline-flex items-center gap-1 text-[#dc9cff]'>
                  <span className='h-1.5 w-1.5 rounded-full bg-[#dc9cff]' />
                  Auto mode
                </span>
              </div>
              <div className='mt-3 space-y-2'>
                {creatorPipeline.map((step, idx) => (
                  <div
                    key={step}
                    className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2'
                  >
                    <p className='text-sm text-white/72'>{step}</p>
                    <span className='text-xs font-semibold text-[#d68dff]'>0{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-4'>
              <span className='text-2xl font-semibold text-[#e19bff]'>10x Output</span>
              <span className='text-xs font-semibold tracking-[0.08em] text-white/45 uppercase'>Case Study</span>
            </div>
          </article>

          <article className='relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,#10162a_0%,#090b13_68%,#090910_100%)] p-6 xl:col-span-3'>
            <span className='rounded-full border border-[#c17dff]/25 bg-[#34184b]/45 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#dda6ff] uppercase'>
              Team Ops
            </span>

            <h3 className='mt-5 text-[34px] leading-[1.05] tracking-[-0.02em] font-semibold text-white'>
              Marketing Teams
            </h3>
            <p className='mt-3 text-base leading-relaxed text-white/50'>
              Turn campaign briefs into ready-to-publish assets with faster review loops.
            </p>

            <div className='mt-6 rounded-xl border border-white/10 bg-black/28 p-3'>
              <p className='text-[11px] text-white/55'>Weekly throughput</p>
              <div className='mt-3 flex h-16 items-end gap-1.5'>
                {marketingBars.map((height, idx) => (
                  <span
                    key={`${height}-${idx}`}
                    className='flex-1 rounded-sm bg-[linear-gradient(180deg,#f39bff_0%,#8f4ee4_100%)] opacity-90'
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-4'>
              <span className='text-2xl font-semibold text-[#dfa0ff]'>Save 20hrs/week</span>
              <span className='text-xs font-semibold tracking-[0.08em] text-white/45 uppercase'>Case Study</span>
            </div>
          </article>

          <article className='relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,#0d161d_0%,#090b12_68%,#090910_100%)] p-6 xl:col-span-3'>
            <span className='rounded-full border border-[#c17dff]/25 bg-[#34184b]/45 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#dda6ff] uppercase'>
              Lean Growth
            </span>

            <h3 className='mt-5 text-[34px] leading-[1.05] tracking-[-0.02em] font-semibold text-white'>
              Small Business
            </h3>
            <p className='mt-3 text-base leading-relaxed text-white/50'>
              Get agency-quality marketing outcomes with lean budget and simple approvals.
            </p>

            <div className='mt-6 space-y-2'>
              {smallBusinessOutcomes.map((point) => (
                <p
                  key={point}
                  className='inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/24 px-3 py-2 text-sm text-white/72'
                >
                  <span className='h-1.5 w-1.5 rounded-full bg-[#d285ff]' />
                  {point}
                </p>
              ))}
            </div>

            <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-4'>
              <span className='text-2xl font-semibold text-[#dca2ff]'>Cut costs 80%</span>
              <span className='text-xs font-semibold tracking-[0.08em] text-white/45 uppercase'>Case Study</span>
            </div>
          </article>

          <article className='relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,#151025_0%,#090b11_60%,#090910_100%)] p-6 md:p-7 xl:col-span-12'>
            <div className='grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center'>
              <div>
                <span className='rounded-full border border-[#c17dff]/25 bg-[#34184b]/45 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#dda6ff] uppercase'>
                  Multi-client
                </span>
                <h3 className='mt-5 text-4xl leading-[1.06] tracking-[-0.02em] font-semibold text-white'>Agencies</h3>
                <p className='mt-3 max-w-[64ch] text-base leading-relaxed text-white/50 md:text-lg'>
                  Scale multi-client production with shared brand systems, client-safe approvals, and white-label
                  reporting.
                </p>
              </div>

              <div className='grid gap-3 sm:grid-cols-3'>
                {agencyHighlights.map((highlight) => (
                  <div key={highlight.label} className='rounded-xl border border-white/10 bg-black/30 p-4'>
                    <p className='text-xs text-white/48'>{highlight.label}</p>
                    <p className='mt-1 text-2xl font-semibold text-[#dca2ff]'>{highlight.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-4'>
              <span className='text-2xl font-semibold text-[#dca2ff]'>3x More Clients</span>
              <span className='text-xs font-semibold tracking-[0.08em] text-white/45 uppercase'>Case Study</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
