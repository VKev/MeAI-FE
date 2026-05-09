import { Bot, Brain, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

const MOCK_THINKINGS = [
  {
    id: 1,
    status: 'done',
    title: 'Analyzing audience intent',
    description: 'Detecting audience behavior and engagement patterns from previous posts.'
  },
  {
    id: 2,
    status: 'done',
    title: 'Optimizing content tone',
    description: 'Adjusting writing style to fit casual social media communication.'
  },
  {
    id: 3,
    status: 'done',
    title: 'Selecting media strategy',
    description: 'Choosing carousel-friendly media arrangement for better retention.'
  },
  {
    id: 4,
    status: 'processing',
    title: 'Generating hashtags',
    description: 'Finding high-relevance hashtags for discoverability.'
  },
  {
    id: 5,
    status: 'queued',
    title: 'Final engagement scoring',
    description: 'Estimating potential interaction performance.'
  }
];

function AIThinkingPanel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);
  return (
    <section className='h-120 overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1020] shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
      <div className='flex items-center justify-between border-b border-white/8 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5'>
            <Brain className='h-5 w-5 text-violet-300' />
          </div>

          <div>
            <h2 className='text-sm font-semibold text-white'>AI Thinkings</h2>
            <p className='text-xs text-slate-400'>Realtime recommendation pipeline</p>
          </div>
        </div>

        <div className='flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300'>
          <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
          Active
        </div>
      </div>

      <div ref={scrollContainerRef} className='h-[calc(100%-84px)] overflow-y-auto px-4 py-5'>
        <div className='relative space-y-4 before:absolute before:left-4.5 before:top-0 before:h-full before:w-px before:bg-white/8'>
          {MOCK_THINKINGS.map((thinking) => {
            const isDone = thinking.status === 'done';
            const isProcessing = thinking.status === 'processing';

            return (
              <div key={thinking.id} className='relative ml-10 rounded-2xl border border-white/8 bg-white/3 p-4'>
                <div className='absolute -left-7.75 top-5 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#0B1020]'>
                  {isDone ? (
                    <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                  ) : isProcessing ? (
                    <Loader2 className='h-4 w-4 animate-spin text-violet-300' />
                  ) : (
                    <Sparkles className='h-4 w-4 text-slate-500' />
                  )}
                </div>

                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <h3 className='text-sm font-medium text-white'>{thinking.title}</h3>

                    <p className='text-xs leading-relaxed text-slate-400'>{thinking.description}</p>
                  </div>

                  <div
                    className={`
                      rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide
                      ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : isProcessing
                            ? 'bg-violet-500/10 text-violet-300'
                            : 'bg-white/5 text-slate-500'
                      }
                    `}
                  >
                    {thinking.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-5 rounded-2xl border border-dashed border-white/10 bg-white/2 p-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5'>
              <Bot className='h-4 w-4 text-white/80' />
            </div>

            <div className='space-y-1'>
              <p className='text-sm font-medium text-white'>Currently generating recommendation...</p>

              <div className='flex items-center gap-2 text-xs text-slate-400'>
                <Loader2 className='h-3 w-3 animate-spin' />
                AI is refining post structure and engagement hooks
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AIThinkingPanel;
