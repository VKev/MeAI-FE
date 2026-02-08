import {
  CirclePlay,
  Clapperboard,
  Facebook,
  Globe2,
  Hash,
  Instagram,
  MessageCircleMore,
  Music2,
  PieChart,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { FacebookIcon, InstagramIcon, ThreadsIcon, TiktokIcon } from '@/components/ui/icons/social-icons';

type FeatureCard = {
  title: string;
  desc: string;
  icon: ReactNode;
  accent: string;
  ring: string;
};

const featureCards: FeatureCard[] = [
  {
    title: 'Text to Video',
    desc: 'AI Generated content for Reels, Shorts & TikToks',
    icon: <Clapperboard className='h-5 w-5' />,
    accent: 'text-[#f17cff]',
    ring: 'from-[#1a1120] via-[#12151f] to-[#0c0c10]'
  },
  {
    title: 'Social Medias',
    desc: 'Facebook, TikTok, Instagram, Threads.',
    icon: <Globe2 className='h-5 w-5' />,
    accent: 'text-[#00c2ff]',
    ring: 'from-[#0d1822] via-[#14131b] to-[#0c0c10]'
  },
  {
    title: 'Social Listening',
    desc: 'Analyze trends from all platforms.',
    icon: <PieChart className='h-5 w-5' />,
    accent: 'text-[#8f4cff]',
    ring: 'from-[#161024] via-[#15141b] to-[#0c0c10]'
  }
];

const textToVideoStages = [
  { until: 25, label: 'Analyzing prompt' },
  { until: 58, label: 'Generating scenes' },
  { until: 92, label: 'Rendering footage' },
  { until: 101, label: 'Video ready' }
];

const textToVideoPrompt = 'Create a 15s TikTok for a new coffee launch. Neon lighting, upbeat music, bold captions.';

const supportedSocialPlatforms = [
  {
    name: 'Facebook',
    Icon: FacebookIcon,
    iconColor: 'text-[#9abbff]',
    boxColor: 'bg-[#16243a]/75',
    ringColor: 'border-[#5f84cd]/35'
  },
  {
    name: 'TikTok',
    Icon: TiktokIcon,
    iconColor: 'text-white',
    boxColor: 'bg-[#17131f]/80',
    ringColor: 'border-[#4c385f]/45'
  },
  {
    name: 'Instagram',
    Icon: InstagramIcon,
    iconColor: 'text-[#ff8fd8]',
    boxColor: 'bg-[#251534]/75',
    ringColor: 'border-[#8b4ebd]/40'
  },
  {
    name: 'Threads',
    Icon: ThreadsIcon,
    iconColor: 'text-white',
    boxColor: 'bg-[#1b1b22]/80',
    ringColor: 'border-[#505367]/35'
  }
] as const;

function TextToVideoPreview() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (hasStarted) return;

    const target = previewRef.current;
    if (!target) return;

    if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.35
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || typedChars >= textToVideoPrompt.length) return;

    const typingTimer = window.setTimeout(() => {
      setTypedChars((current) => Math.min(current + 1, textToVideoPrompt.length));
    }, 22);

    return () => window.clearTimeout(typingTimer);
  }, [hasStarted, typedChars]);

  useEffect(() => {
    if (!hasStarted || progress >= 100) return;

    const progressTimer = window.setTimeout(() => {
      setProgress((current) => Math.min(current + 2, 100));
    }, 90);

    return () => window.clearTimeout(progressTimer);
  }, [hasStarted, progress]);

  const stageLabel = hasStarted
    ? (textToVideoStages.find((stage) => progress < stage.until)?.label ?? 'Video ready')
    : 'Awaiting prompt';
  const isReady = progress >= 100;
  const promptText = hasStarted ? textToVideoPrompt.slice(0, typedChars) : 'Describe your video idea...';

  return (
    <div ref={previewRef} className='relative h-full overflow-hidden rounded-[16px] border border-white/10 bg-[#06060b] p-3'>
      <div className='pointer-events-none absolute -top-10 right-[-10px] h-28 w-28 rounded-full bg-[#d26fff]/20 blur-2xl' />
      <div className='pointer-events-none absolute -bottom-8 left-[-14px] h-24 w-24 rounded-full bg-[#8d4dff]/18 blur-2xl' />

      <div className='relative h-full rounded-xl border border-white/10 bg-[linear-gradient(160deg,#1a1127_0%,#090911_58%,#21113b_100%)] p-3'>
        <div className='flex items-center justify-between'>
          <p className='text-[10px] font-semibold tracking-wide text-white/70 uppercase'>Prompt to Video</p>
          <span className='inline-flex items-center gap-1 rounded-full border border-[#df96ff]/35 bg-[#2f1544]/70 px-2 py-0.5 text-[9px] font-semibold text-[#ebb8ff]'>
            <Sparkles className='h-3 w-3' />
            {isReady ? 'Generated' : hasStarted ? 'Generating' : 'Queued'}
          </span>
        </div>

        <div className='mt-2 rounded-lg border border-white/12 bg-black/45 px-2.5 py-2 text-[10px] text-white/72'>
          {promptText}
          {hasStarted && !isReady && <span className='ml-0.5 inline-block h-3 w-[1px] bg-[#efb6ff] align-middle animate-pulse' />}
        </div>

        <div className='relative mt-3 h-[136px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(165deg,#120a1d_0%,#24103a_45%,#0a0b12_100%)]'>
          {isReady ? (
            <img src='/coffee.webp' alt='Generated coffee video result' className='h-full w-full object-cover object-center' />
          ) : (
            <>
              <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_30%,rgba(214,102,255,0.25),rgba(214,102,255,0)_64%)]' />
              <div className='pointer-events-none absolute left-3 top-3 h-10 w-20 rounded-md border border-white/10 bg-white/4' />
              <div className='pointer-events-none absolute right-4 top-6 h-8 w-12 rounded-full border border-white/10 bg-white/5' />
              <div className='pointer-events-none absolute bottom-11 left-3 right-3 h-1.5 rounded-full bg-white/10' />
            </>
          )}

          <span className='absolute left-2.5 top-2 inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/45 px-2 py-0.5 text-[9px] font-semibold text-[#efc0ff]'>
            <Sparkles className='h-3 w-3' />
            {stageLabel}
          </span>

          <span
            className={`absolute right-2.5 top-2 rounded-full border border-white/12 bg-black/45 px-2 py-0.5 text-[9px] font-semibold ${
              isReady ? 'text-[#b6ffdb]' : hasStarted ? 'text-white/72' : 'text-white/55'
            }`}
          >
            {isReady ? 'Ready' : hasStarted ? 'Rendering' : 'Waiting'}
          </span>

          <div className='absolute inset-x-3 bottom-3 flex items-center gap-2'>
            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-white/15'>
              <div className='h-full rounded-full bg-[#d778ff] transition-all duration-500 ease-out' style={{ width: `${progress}%` }} />
            </div>
            <CirclePlay className='h-4 w-4 text-[#f0beff]' />
          </div>
        </div>

        <div className='mt-3 flex items-center justify-between text-[10px] text-white/70'>
          <span className='inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-semibold text-[#edb7ff]'>
            <Clapperboard className='h-3.5 w-3.5' />
            Output: Reel 1080x1920
          </span>
          <span className='rounded-full border border-white/12 bg-black/40 px-2 py-0.5 text-white/70'>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

function FeaturePreview({ index }: { index: number }) {
  if (index === 0) {
    return <TextToVideoPreview />;
  }

  if (index === 1) {
    return (
      <div className='relative h-full overflow-hidden rounded-[16px] border border-white/10 bg-[#06060b] p-3'>
        <div className='pointer-events-none absolute -right-8 top-[-24px] h-28 w-28 rounded-full bg-[#00c2ff]/18 blur-2xl' />
        <div className='pointer-events-none absolute -bottom-12 left-[-8px] h-28 w-28 rounded-full bg-[#7f66ff]/20 blur-2xl' />

        <div className='flex h-full flex-col rounded-xl border border-white/10 bg-[#0a101a]/90 p-3'>
          <div className='flex items-center justify-between text-[10px]'>
            <span className='text-white/55'>Publishing Network</span>
            <span className='rounded-full border border-[#65d4ff]/30 bg-[#112238]/70 px-2 py-0.5 font-semibold text-[#74d8ff]'>
              4 platforms
            </span>
          </div>

          <div className='mt-3 grid grid-cols-2 gap-2'>
            {supportedSocialPlatforms.map((platform) => (
              <div key={platform.name} className={`rounded-lg border ${platform.ringColor} ${platform.boxColor} p-2`}>
                <div className='flex items-center justify-between'>
                  <span className='inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/35'>
                    <platform.Icon size={14} className={platform.iconColor} />
                  </span>
                  <span className='h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.7)]' />
                </div>
                <p className='mt-1.5 text-[11px] font-semibold text-white'>{platform.name}</p>
                <p className='text-[9px] text-white/55'>Connected</p>
              </div>
            ))}
          </div>

          <div className='mt-2.5 grid grid-cols-4 gap-1.5 rounded-lg border border-white/10 bg-[#0a111d]/85 p-2'>
            {supportedSocialPlatforms.map((platform) => (
              <span key={`${platform.name}-status`} className='inline-flex items-center justify-center rounded-md border border-white/10 bg-black/30 py-1'>
                <platform.Icon size={12} className={platform.iconColor} />
              </span>
            ))}
          </div>

          <div className='mt-2.5 flex items-center justify-between rounded-lg border border-white/10 bg-[#0a111d]/85 px-2.5 py-1.5 text-[9px]'>
            <span className='text-white/55'>Auto-post pipeline</span>
            <span className='rounded-full border border-[#66d8ff]/30 bg-[#12253a]/70 px-2 py-0.5 font-semibold text-[#7fe1ff]'>
              Enabled
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative h-full overflow-hidden rounded-[16px] border border-white/10 bg-[#06060b] p-3'>
      <div className='pointer-events-none absolute -right-8 top-[-26px] h-28 w-28 rounded-full bg-[#9f58ff]/20 blur-2xl' />
      <div className='pointer-events-none absolute -left-10 bottom-[-18px] h-24 w-24 rounded-full bg-[#7f58ff]/16 blur-2xl' />

      <div className='flex h-full flex-col rounded-xl border border-white/10 bg-[#0d0a16]/92 p-3'>
        <div className='flex items-center justify-between text-[10px]'>
          <span className='text-white/55'>Conversation Radar</span>
          <span className='inline-flex items-center gap-1 rounded-full border border-[#9f58ff]/30 bg-[#29143c]/70 px-2 py-0.5 font-semibold text-[#dca0ff]'>
            <TrendingUp className='h-3 w-3' />
            +18% this hour
          </span>
        </div>

        <div className='mt-2.5 flex-1 space-y-2 overflow-hidden'>
          {[
            { topic: '#productlaunch', count: '2.1k mentions', sentiment: 'Positive' }
          ].map((item) => (
            <div key={item.topic} className='rounded-lg border border-white/10 bg-[#110d1b]/86 p-2.5'>
              <div className='flex items-center justify-between'>
                <p className='inline-flex items-center gap-1 truncate text-[11px] font-semibold text-[#bb7cff]'>
                  <Hash className='h-3.5 w-3.5' />
                  {item.topic}
                </p>
                <span className='rounded-full bg-[#26123a] px-2 py-0.5 text-[9px] text-[#da98ff]'>
                  {item.sentiment}
                </span>
              </div>
              <p className='mt-1 truncate text-[10px] text-white/52'>{item.count}</p>
            </div>
          ))}
        </div>

        <div className='mt-2.5 rounded-lg border border-white/10 bg-[#110d1b]/86 p-2.5'>
          <div className='mb-2 flex items-center justify-between text-[10px]'>
            <span className='text-white/55'>Trend pulse</span>
            <span className='font-semibold text-[#dba0ff]'>Live</span>
          </div>

          <div className='grid h-9 grid-cols-12 items-end gap-1'>
            {[24, 34, 30, 38, 42, 52, 46, 58, 64, 56, 70, 78].map((height, idx) => (
              <span
                key={`${height}-${idx}`}
                className='rounded-sm bg-[linear-gradient(180deg,#d67cff_0%,#7f49ff_100%)] opacity-85'
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className='mt-2.5 grid grid-cols-3 gap-2 text-[10px]'>
          <div className='rounded-lg border border-white/10 bg-[#110d1b]/86 px-2 py-1.5'>
            <p className='text-white/55'>Mentions</p>
            <p className='mt-0.5 text-sm font-semibold text-[#dfb1ff]'>1.2k</p>
          </div>

          <div className='rounded-lg border border-white/10 bg-[#110d1b]/86 px-2 py-1.5'>
            <p className='text-white/55'>Sentiment</p>
            <p className='mt-0.5 text-sm font-semibold text-[#b4ffdf]'>71%</p>
          </div>

          <div className='rounded-lg border border-white/10 bg-[#110d1b]/86 px-2 py-1.5'>
            <p className='text-white/55'>New alerts</p>
            <p className='mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-[#dcb0ff]'>
              <MessageCircleMore className='h-3.5 w-3.5' />
              342
            </p>
          </div>
        </div>

        <div className='mt-2.5 inline-flex items-center justify-between rounded-lg border border-white/10 bg-[#0f0f18]/85 px-2.5 py-1.5 text-[10px]'>
          <span className='text-white/55'>Signal status</span>
          <span className='inline-flex items-center gap-1 rounded-full border border-[#9f58ff]/35 bg-[#241336]/80 px-2 py-0.5 font-semibold text-[#dda6ff]'>
            <span className='h-1.5 w-1.5 rounded-full bg-[#d078ff] shadow-[0_0_8px_rgba(208,120,255,0.8)]' />
            Monitoring
          </span>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id='features' className='relative border-b border-white/6 py-14 md:py-16 overflow-hidden'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-22' />
        <div className='absolute left-0 top-20 h-[460px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(235,132,255,0.14),rgba(235,132,255,0)_70%)] blur-3xl' />
        <div className='absolute right-0 top-0 h-[480px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(98,86,255,0.16),rgba(98,86,255,0)_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
        <div className='mb-12 py-4'>
          <div className='flex items-center justify-center gap-12 text-white/38'>
            <Facebook className='h-6 w-6' />
            <Music2 className='h-6 w-6' />
            <Instagram className='h-6 w-6' />
          </div>
        </div>

        <div className='mx-auto max-w-4xl text-center mt-20'>
          <h2 className='text-4xl leading-[1.05] tracking-[-0.025em] font-semibold text-white md:text-6xl'>
            Everything you need to <span className='text-gradient-primary'>scale faster</span>
          </h2>
          <p className='mt-4 text-lg text-white/42 md:text-2xl'>
            Replace your entire marketing stack with one AI-powered platform.
          </p>
        </div>

        <div className='mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3'>
          {featureCards.map((card, index) => (
            <article
              key={card.title}
              className={`relative flex h-full min-h-[495px] flex-col rounded-[30px] border border-white/10 bg-gradient-to-b ${card.ring} p-6`}
            >
              <div className='flex min-h-[126px] items-start justify-between gap-4'>
                <div>
                  <h3 className='text-3xl leading-tight font-semibold text-white md:text-[32px]'>{card.title}</h3>
                  <p className='mt-2 text-base text-white/45 md:text-lg'>{card.desc}</p>
                </div>
                <div className={`rounded-xl bg-white/5 p-2 ${card.accent}`}>{card.icon}</div>
              </div>

              <div className='mt-8 flex-1 rounded-[18px] border border-white/10 bg-black/20 p-4'>
                <FeaturePreview index={index} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
