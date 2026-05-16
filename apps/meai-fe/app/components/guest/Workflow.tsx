import { useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  Coins,
  Database,
  FolderUp,
  Globe2,
  MousePointerClick,
  Rocket,
  Send,
  Sparkles,
  TrendingUp
} from 'lucide-react';

type WorkflowStep = {
  number: string;
  title: string;
  subtitle: string;
  detail: string;
  badge: string;
};

const steps: WorkflowStep[] = [
  {
    number: '01',
    title: 'Input Content or Data',
    subtitle: 'Connect your sources',
    detail: 'Upload raw footage or connect your existing asset libraries.',
    badge: 'STEP 01'
  },
  {
    number: '02',
    title: 'AI Processing',
    subtitle: 'Auto-edit & optimize',
    detail: 'Our engines identify viral moments and auto-edit clips.',
    badge: 'STEP 02'
  },
  {
    number: '03',
    title: 'Distribution',
    subtitle: 'Publish everywhere',
    detail: 'Push content to every channel at the best possible time.',
    badge: 'STEP 03'
  },
  {
    number: '04',
    title: 'Conversion',
    subtitle: 'Track & Grow',
    detail: 'Monitor ROI and scale campaigns based on real-time results.',
    badge: 'STEP 04'
  }
];

function InputStepPreview() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between text-[11px] text-white/55'>
        <span>Connected Sources</span>
        <span className='rounded-full border border-[#aa49f0]/40 bg-[#2a1137]/75 px-2 py-0.5 font-semibold text-[#d070ff]'>
          4 active
        </span>
      </div>

      <div className='mt-3 grid grid-cols-2 gap-2 text-[10px]'>
        {[
          { label: 'Google Drive', icon: Database },
          { label: 'Dropbox', icon: FolderUp },
          { label: 'Website CMS', icon: Globe2 },
          { label: 'Product Feed', icon: MousePointerClick }
        ].map((source) => (
          <div key={source.label} className='rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2'>
            <p className='inline-flex items-center gap-1 text-white/75'>
              <source.icon className='h-3.5 w-3.5 text-[#d070ff]' />
              {source.label}
            </p>
            <p className='mt-1 text-[9px] text-emerald-300/85'>Synced</p>
          </div>
        ))}
      </div>

      <div className='mt-3 flex-1 rounded-xl border border-dashed border-white/18 bg-black/30 p-4'>
        <div className='flex h-full flex-col items-center justify-center text-center'>
          <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d070ff]/20 text-[#e2a6ff]'>
            <FolderUp className='h-5 w-5' />
          </span>
          <p className='mt-3 text-sm font-semibold text-white'>Drop assets or connect data</p>
          <p className='mt-1 max-w-[320px] text-xs text-white/45'>
            Upload raw footage, product files, and campaign docs to start processing.
          </p>
        </div>
      </div>

      <div className='mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[10px]'>
        <div className='flex items-center justify-between text-white/70'>
          <span>Total assets imported</span>
          <span className='font-semibold text-[#e2a6ff]'>42 files</span>
        </div>
        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-white/12'>
          <div className='h-full w-[84%] rounded-full bg-[linear-gradient(90deg,#a947ef,#e38cff)]' />
        </div>
      </div>
    </div>
  );
}

function ProcessingStepPreview() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between text-[11px] text-white/55'>
        <span>AI Processing Pipeline</span>
        <span className='inline-flex items-center gap-1 rounded-full border border-[#aa49f0]/35 bg-[#2a1137]/70 px-2 py-0.5 font-semibold text-[#d98dff]'>
          <Sparkles className='h-3 w-3' />
          Running
        </span>
      </div>

      <div className='mt-3 space-y-2 text-[10px]'>
        {[
          { label: 'Detect viral hooks', status: 'done' },
          { label: 'Auto-cut scenes', status: 'done' },
          { label: 'Generate captions', status: 'active' },
          { label: 'Apply brand tone', status: 'queue' }
        ].map((task) => (
          <div
            key={task.label}
            className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2'
          >
            <p className='text-white/72'>{task.label}</p>
            {task.status === 'done' && (
              <span className='inline-flex items-center gap-1 text-emerald-300/90'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                Done
              </span>
            )}
            {task.status === 'active' && (
              <span className='inline-flex items-center gap-1 text-[#e2a6ff]'>
                <Sparkles className='h-3.5 w-3.5 animate-pulse' />
                Processing
              </span>
            )}
            {task.status === 'queue' && <span className='text-white/40'>Queued</span>}
          </div>
        ))}
      </div>

      <div className='mt-3 flex-1 rounded-xl border border-white/10 bg-black/30 p-3'>
        <div className='grid h-full grid-cols-3 gap-2'>
          {[72, 58, 83].map((value, idx) => (
            <div key={`${value}-${idx}`} className='rounded-lg border border-white/10 bg-white/[0.03] p-2'>
              <p className='text-[9px] text-white/45'>Scene {idx + 1}</p>
              <div className='mt-2 h-14 rounded-md border border-white/10 bg-[radial-gradient(circle_at_70%_20%,rgba(209,112,255,0.25),rgba(0,0,0,0)_70%)]' />
              <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-white/12'>
                <div className='h-full rounded-full bg-[#c66bff]' style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px]'>
        <div className='flex items-center justify-between text-white/70'>
          <span>Generation progress</span>
          <span className='font-semibold text-[#dfa1ff]'>78%</span>
        </div>
        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-white/12'>
          <div className='h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#8f49ef,#d97fff)]' />
        </div>
      </div>
    </div>
  );
}

function DistributionStepPreview() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between text-[11px] text-white/55'>
        <span>Distribution Scheduler</span>
        <span className='inline-flex items-center gap-1 rounded-full border border-[#aa49f0]/35 bg-[#2a1137]/70 px-2 py-0.5 font-semibold text-[#d98dff]'>
          <CalendarClock className='h-3 w-3' />
          Best-time slots
        </span>
      </div>

      <div className='mt-3 grid grid-cols-4 gap-2 text-[10px]'>
        {['Facebook', 'TikTok', 'Instagram', 'Threads'].map((channel) => (
          <div key={channel} className='rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center'>
            <p className='truncate text-white/75'>{channel}</p>
            <p className='mt-1 inline-flex items-center gap-1 text-emerald-300/85'>
              <Check className='h-3 w-3' />
              Ready
            </p>
          </div>
        ))}
      </div>

      <div className='mt-3 flex-1 rounded-xl border border-white/10 bg-black/30 p-3'>
        <div className='grid h-full grid-cols-5 gap-2'>
          {[32, 48, 82, 54, 38].map((peak, idx) => (
            <div key={`${peak}-${idx}`} className='relative rounded-lg border border-white/10 bg-white/[0.03] p-1.5'>
              <p className='text-center text-[9px] text-white/45'>D{idx + 1}</p>
              <div className='mt-1.5 flex h-[110px] items-end justify-center'>
                <div
                  className='w-5 rounded-md bg-[linear-gradient(180deg,#e18dff_0%,#7f48ff_100%)]'
                  style={{ height: `${peak}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[10px]'>
        <p className='text-white/55'>Next publishes</p>
        <div className='mt-1.5 space-y-1.5'>
          {['TikTok Reel - Today 7:30 PM', 'Instagram Story - Today 8:15 PM', 'Threads Post - Tomorrow 9:00 AM'].map(
            (item) => (
              <p key={item} className='inline-flex items-center gap-1.5 text-white/72'>
                <Send className='h-3 w-3 text-[#d786ff]' />
                {item}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ConversionStepPreview() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between text-[11px] text-white/55'>
        <span>Conversion Dashboard</span>
        <span className='inline-flex items-center gap-1 rounded-full border border-[#aa49f0]/35 bg-[#2a1137]/70 px-2 py-0.5 font-semibold text-[#d98dff]'>
          <TrendingUp className='h-3 w-3' />
          Live ROI
        </span>
      </div>

      <div className='mt-3 grid grid-cols-3 gap-2 text-[10px]'>
        <div className='rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2'>
          <p className='text-white/50'>CTR</p>
          <p className='mt-1 text-sm font-semibold text-white'>6.4%</p>
        </div>
        <div className='rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2'>
          <p className='text-white/50'>CPL</p>
          <p className='mt-1 text-sm font-semibold text-white'>$3.20</p>
        </div>
        <div className='rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2'>
          <p className='text-white/50'>Revenue</p>
          <p className='mt-1 text-sm font-semibold text-white'>$12.8k</p>
        </div>
      </div>

      <div className='mt-3 flex-1 rounded-xl border border-white/10 bg-black/30 p-3'>
        <div className='mb-2 flex items-center justify-between text-[10px] text-white/55'>
          <span className='inline-flex items-center gap-1'>
            <BarChart3 className='h-3.5 w-3.5 text-[#d786ff]' />
            Performance trend
          </span>
          <span className='text-emerald-300/90'>+240%</span>
        </div>
        <div className='grid h-[140px] grid-cols-10 items-end gap-1.5'>
          {[18, 22, 30, 34, 40, 46, 58, 63, 70, 78].map((value, idx) => (
            <span
              key={`${value}-${idx}`}
              className='rounded-sm bg-[linear-gradient(180deg,#e18dff_0%,#7f48ff_100%)]'
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </div>

      <div className='mt-3 grid grid-cols-2 gap-2 text-[10px]'>
        <div className='rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2'>
          <p className='inline-flex items-center gap-1 text-white/55'>
            <Coins className='h-3.5 w-3.5 text-[#d786ff]' />
            Cost efficiency
          </p>
          <p className='mt-1 text-sm font-semibold text-white'>-32% CPA</p>
        </div>
        <div className='rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2'>
          <p className='inline-flex items-center gap-1 text-white/55'>
            <Rocket className='h-3.5 w-3.5 text-[#d786ff]' />
            Scale score
          </p>
          <p className='mt-1 text-sm font-semibold text-white'>High intent</p>
        </div>
      </div>
    </div>
  );
}

function WorkflowStepPreview({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 0) return <InputStepPreview />;
  if (stepIndex === 1) return <ProcessingStepPreview />;
  if (stepIndex === 2) return <DistributionStepPreview />;
  return <ConversionStepPreview />;
}

export function Workflow() {
  const [activeStep, setActiveStep] = useState(0);

  const step = steps[activeStep];

  return (
    <section id='workflow' className='relative overflow-hidden border-b border-white/6 pt-20 pb-10 md:pt-24 md:pb-14'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-18' />
      </div>

      <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='inline-flex items-center gap-2 rounded-full border border-[#7d2cff]/45 bg-[#22102f]/70 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-[#c85dff]'>
            <Sparkles className='h-3.5 w-3.5' />
            HOW IT WORKS
          </div>
          <h2 className='mt-5 text-4xl leading-tight tracking-[-0.025em] font-semibold text-white md:text-6xl'>
            From Idea to <span className='text-gradient-primary'>Conversion</span>
          </h2>
          <p className='mt-4 text-lg text-white/45 md:text-2xl'>
            Simple 4-step workflow to automate your entire marketing process
          </p>
        </div>

        <div className='mt-14 grid gap-8 lg:grid-cols-[40%_60%]'>
          <div className='lg:sticky lg:top-24 lg:h-fit'>
            <div className='space-y-5'>
              {steps.map((item, index) => {
                const active = index === activeStep;
                return (
                  <button
                    key={item.number}
                    type='button'
                    onClick={() => setActiveStep(index)}
                    className={`w-full rounded-2xl border px-5 py-5 text-left transition-colors ${
                      active
                        ? 'border-[#c270ff]/35 bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]'
                        : 'border-transparent bg-transparent hover:bg-white/4'
                    }`}
                  >
                    <div className='flex items-center gap-4'>
                      <span className={`text-4xl font-semibold ${active ? 'text-[#e184ff]' : 'text-white/30'}`}>
                        {item.number}
                      </span>
                      <div>
                        <p className={`text-2xl font-semibold ${active ? 'text-white' : 'text-white/38'}`}>
                          {item.title}
                        </p>
                        <p className={`text-base ${active ? 'text-white/55' : 'text-white/24'}`}>{item.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='relative'>
            <div className='sticky top-24 rounded-[30px] border border-white/12 bg-[#090910]/90 p-6 md:p-8'>
              <div className='inline-flex items-center gap-2 rounded-full bg-[#2a1137] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[#d070ff]'>
                <Sparkles className='h-3 w-3' />
                {step.badge}
              </div>

              <h3 className='mt-5 text-3xl leading-tight font-semibold text-white md:text-5xl'>{step.title}</h3>
              <p className='mt-3 text-base text-white/52 md:text-2xl'>{step.detail}</p>

              <div className='mt-6 rounded-2xl border border-white/12 bg-black/25 p-1'>
                <div className='relative min-h-[420px] rounded-xl border border-white/10 bg-[#06060a] p-4 md:p-5'>
                  <div className='absolute left-0 top-0 h-full w-[3px] rounded-full bg-[#aa49f0] opacity-90' />
                  <div key={step.badge} className='h-full'>
                    <WorkflowStepPreview stepIndex={activeStep} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
