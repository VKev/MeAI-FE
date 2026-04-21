import type { Route } from './+types/about';
import { Link, useLoaderData } from 'react-router';
import { ArrowRight, Clock3, Layers, Rocket, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';

type AboutMetric = {
  value: string;
  label: string;
};

type PrincipleIconKey = 'target' | 'layers' | 'shield';

type AboutPrinciple = {
  iconKey: PrincipleIconKey;
  title: string;
  description: string;
};

type AboutOperatingModelStep = {
  title: string;
  description: string;
};

type AboutMember = {
  name: string;
  role: string;
  image: string;
};

type AboutLoaderData = {
  origin: string;
  pageUrl: string;
  imageUrl: string;
  platformNumbers: ReadonlyArray<AboutMetric>;
  principles: ReadonlyArray<AboutPrinciple>;
  operatingModel: ReadonlyArray<AboutOperatingModelStep>;
  members: ReadonlyArray<AboutMember>;
  schema: {
    '@context': string;
    '@graph': Array<Record<string, unknown>>;
  };
};

const principleIcons = {
  target: Target,
  layers: Layers,
  shield: ShieldCheck
} satisfies Record<PrincipleIconKey, typeof Target>;

function getAboutContent() {
  return {
    platformNumbers: [
      { value: '18k+', label: 'Creators using MeAI' },
      { value: '240%', label: 'Average engagement lift' },
      { value: '4', label: 'Core product loops' }
    ],
    principles: [
      {
        iconKey: 'target',
        title: 'Outcome-first product design',
        description:
          'Every release starts from a measurable business result, then we design flows that move creators there faster.'
      },
      {
        iconKey: 'layers',
        title: 'Systems over one-off features',
        description:
          'We build reusable automation layers so teams can publish, test, and improve without rebuilding the workflow.'
      },
      {
        iconKey: 'shield',
        title: 'Quality and trust by default',
        description:
          'From brand controls to data handling, reliability is designed in early instead of patched on after launch.'
      }
    ],
    operatingModel: [
      {
        title: 'Research',
        description: 'Map creator pain points and identify the highest-friction marketing tasks.'
      },
      {
        title: 'Prototype',
        description: 'Design and test compact interaction loops before scaling them into product modules.'
      },
      {
        title: 'Ship',
        description: 'Release with clear telemetry so every launch teaches us what to improve next.'
      },
      {
        title: 'Refine',
        description: 'Continuously tune automation quality, speed, and channel performance.'
      }
    ],
    members: [
      { name: 'Duy', role: 'Front-End Engineer', image: '/images/team/duy.jpg' },
      { name: 'Dung', role: 'Front-End Engineer', image: '/images/team/dung.jpg' },
      { name: 'Khang', role: 'Back-End Engineer', image: '/images/team/khang.jpg' },
      { name: 'Vinh', role: 'Back-End Engineer', image: '/images/team/vinh.png' }
    ]
  } satisfies Pick<AboutLoaderData, 'platformNumbers' | 'principles' | 'operatingModel' | 'members'>;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;
  const content = getAboutContent();

  return {
    origin,
    pageUrl: `${origin}/about`,
    imageUrl: `${origin}/logo-meai.webp`,
    ...content,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'MeAI',
          url: origin,
          logo: `${origin}/logo-meai.webp`
        },
        {
          '@type': 'AboutPage',
          name: 'About MeAI',
          url: `${origin}/about`,
          description: 'Mission, principles, and operating model behind MeAI.'
        }
      ]
    }
  } satisfies AboutLoaderData;
}

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
});

export function shouldRevalidate() {
  return false;
}

export const links: Route.LinksFunction = () => [{ rel: 'canonical', href: '/about' }];

export function meta({ data }: Route.MetaArgs) {
  const routeData = data as AboutLoaderData | undefined;
  const pageUrl = routeData?.pageUrl ?? '/about';
  const imageUrl = routeData?.imageUrl ?? '/logo-meai.webp';

  return [
    { title: 'About - MeAI' },
    {
      name: 'description',
      content: 'Learn how MeAI builds practical AI marketing workflows for creators, teams, and agencies.'
    },
    { name: 'keywords', content: 'about MeAI, AI marketing team, marketing automation company, creator tools' },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'MeAI' },
    { property: 'og:title', content: 'About MeAI - AI Marketing Team and Mission' },
    {
      property: 'og:description',
      content: 'Meet the team behind MeAI and see the operating model we use to ship practical AI marketing software.'
    },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'About MeAI - AI Marketing Team and Mission' },
    {
      name: 'twitter:description',
      content: 'See how MeAI designs and ships AI marketing products with a focused, outcome-driven process.'
    },
    { name: 'twitter:image', content: imageUrl }
  ];
}

export default function About() {
  const { schema, platformNumbers, principles, operatingModel, members } = useLoaderData<typeof loader>();

  return (
    <div className='landing-page relative min-h-screen overflow-x-hidden'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className='relative z-10'>
        <section className='relative border-b border-white/6 pt-28 pb-16 md:pt-36 md:pb-24'>
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute inset-0 landing-grid opacity-20' />
            <div className='absolute left-1/2 top-4 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(164,93,255,0.2),rgba(164,93,255,0)_74%)] blur-3xl' />
          </div>

          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#11111a]/72 px-3 py-1.5 text-xs font-medium text-white/78'>
              <Sparkles className='h-3.5 w-3.5 text-[#d66bff]' />
              <span>About MeAI</span>
            </div>

            <div className='mx-auto max-w-4xl text-center'>
              <h1 className='text-5xl leading-[0.95] tracking-[-0.03em] font-semibold text-white sm:text-6xl md:text-8xl'>
                Built for
                <span className='block text-gradient-primary'>Practical AI Growth</span>
              </h1>

              <p className='mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/62 md:text-2xl'>
                MeAI is a focused team of engineers and operators building a marketing system that helps creators and
                businesses produce, distribute, and learn faster across every channel.
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
                  href='#our-story'
                  className='flex items-center gap-3 rounded-full border border-white/18 px-9 py-4 text-base font-semibold text-white hover:bg-white/6 transition-colors md:text-lg'
                >
                  Explore Our Story
                </a>
              </div>
            </div>

            <div className='mt-14 grid gap-4 sm:grid-cols-3'>
              {platformNumbers.map((metric) => (
                <article
                  key={metric.label}
                  className='rounded-2xl border border-white/10 bg-black/30 px-5 py-5 text-center backdrop-blur-sm'
                >
                  <p className='text-3xl font-semibold text-white md:text-4xl'>{metric.value}</p>
                  <p className='mt-2 text-sm text-white/58 md:text-base'>{metric.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id='our-story' className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute inset-0 landing-grid opacity-12' />
          </div>

          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='grid gap-6 lg:grid-cols-[1.2fr_1fr]'>
              <article className='rounded-[28px] border border-white/10 bg-[#090911]/75 p-7 backdrop-blur-sm md:p-10'>
                <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/78'>
                  <Users className='h-3.5 w-3.5 text-[#d66bff]' />
                  Our Story
                </div>
                <h2 className='text-3xl leading-tight font-semibold tracking-tight text-white md:text-5xl'>
                  We started by fixing our own marketing bottlenecks
                </h2>
                <p className='mt-6 text-base leading-relaxed text-white/62 md:text-lg'>
                  MeAI began as an internal toolkit for content teams who were spending more time moving assets than
                  creating strategy. We productized that workflow into a platform that keeps execution consistent while
                  preserving creative control.
                </p>
                <p className='mt-4 text-base leading-relaxed text-white/62 md:text-lg'>
                  Today, our roadmap stays simple: remove repetitive steps, increase output quality, and make every
                  campaign easier to learn from.
                </p>
              </article>

              <article className='rounded-[28px] border border-white/10 bg-black/35 p-7 backdrop-blur-sm md:p-10'>
                <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/78'>
                  <Clock3 className='h-3.5 w-3.5 text-[#d66bff]' />
                  Operating Model
                </div>
                <ol className='space-y-4'>
                  {operatingModel.map((step, index) => (
                    <li key={step.title} className='rounded-2xl border border-white/8 bg-[#0d0d16]/88 px-4 py-4'>
                      <div className='flex items-center gap-3'>
                        <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/88'>
                          {index + 1}
                        </span>
                        <p className='text-lg font-semibold text-white'>{step.title}</p>
                      </div>
                      <p className='mt-2 text-sm leading-relaxed text-white/58'>{step.description}</p>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          </div>
        </section>

        <section className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-10 text-center'>
              <p className='text-xs font-medium tracking-[0.22em] text-white/44 uppercase'>Principles</p>
              <h2 className='mt-3 text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                How We Build
              </h2>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              {principles.map((principle) => {
                const Icon = principleIcons[principle.iconKey];

                return (
                  <article
                    key={principle.title}
                    className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6 transition-colors hover:border-white/20'
                  >
                    <div className='mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d89dff]'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='text-2xl font-semibold text-white'>{principle.title}</h3>
                    <p className='mt-3 text-base leading-relaxed text-white/58'>{principle.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-10 flex items-end justify-between gap-4'>
              <div>
                <p className='text-xs font-medium tracking-[0.22em] text-white/44 uppercase'>Team</p>
                <h2 className='mt-3 text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                  The Builders Behind MeAI
                </h2>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {members.map((member) => (
                <article
                  key={member.name}
                  className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-5 transition-colors hover:border-white/20'
                >
                  <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-black/30'>
                    <img
                      src={member.image}
                      alt={member.name}
                      loading='lazy'
                      decoding='async'
                      width={512}
                      height={512}
                      className='h-64 w-full object-cover object-center'
                    />
                  </div>
                  <h3 className='mt-4 text-2xl font-semibold text-white'>{member.name}</h3>
                  <p className='mt-1 text-sm text-white/56'>{member.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='section-auto relative py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[920px] px-4 sm:px-6'>
            <div className='rounded-[30px] border border-white/12 bg-[#0d0d16]/84 px-7 py-10 text-center backdrop-blur-sm md:px-12 md:py-14'>
              <div className='mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d89dff]'>
                <Rocket className='h-5 w-5' />
              </div>
              <h2 className='text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                Join the Next Chapter
              </h2>
              <p className='mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/60 md:text-lg'>
                If you want a marketing platform that feels fast, intentional, and production-ready, MeAI is built for
                your team.
              </p>
              <div className='mt-8 flex justify-center'>
                <Link
                  to='/auth/sign-in'
                  className='group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-transform hover:-translate-y-0.5 md:text-lg'
                >
                  Start Creating Free
                  <ArrowRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
