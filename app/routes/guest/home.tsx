import type { Route } from './+types/home';
import { useLoaderData } from 'react-router';
import { Hero, Features, Workflow, UseCases, Feedbacks, ValueProposition, CTA } from '@/components/guest';

type HomeLoaderData = {
  origin: string;
  pageUrl: string;
  imageUrl: string;
  schema: {
    '@context': string;
    '@graph': Array<Record<string, unknown>>;
  };
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;

  return {
    origin,
    pageUrl: `${origin}/`,
    imageUrl: `${origin}/logo-meai.webp`,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'MeAI',
          url: origin,
          logo: `${origin}/logo-meai.webp`,
          sameAs: []
        },
        {
          '@type': 'WebSite',
          name: 'MeAI',
          url: origin,
          inLanguage: 'en-US'
        },
        {
          '@type': 'SoftwareApplication',
          name: 'MeAI',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: origin,
          description: 'AI-powered marketing automation for creators, teams, and agencies.'
        }
      ]
    }
  } satisfies HomeLoaderData;
}

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
});

export function shouldRevalidate() {
  return false;
}

export const links: Route.LinksFunction = () => [{ rel: 'canonical', href: '/' }];

export function meta({ data }: Route.MetaArgs) {
  const routeData = data as HomeLoaderData | undefined;
  const pageUrl = routeData?.pageUrl ?? '/';
  const imageUrl = routeData?.imageUrl ?? '/logo-meai.webp';

  return [
    { title: 'MeAI - AI Marketing Automation Platform' },
    {
      name: 'description',
      content:
        'Scale faster with MeAI. Generate, schedule, and optimize marketing content across channels from one AI-powered workflow.'
    },
    {
      name: 'keywords',
      content:
        'AI marketing automation, text to video, social media automation, content workflow, creator marketing platform'
    },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'MeAI' },
    { property: 'og:title', content: 'MeAI - AI Marketing Automation Platform' },
    {
      property: 'og:description',
      content:
        'Create, distribute, and automate your marketing content across channels with an AI workflow built for creators and teams.'
    },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'MeAI - AI Marketing Automation Platform' },
    {
      name: 'twitter:description',
      content: 'Run faster campaigns with AI-assisted creation, publishing, and optimization in one platform.'
    },
    { name: 'twitter:image', content: imageUrl }
  ];
}

export default function Home() {
  const { schema } = useLoaderData<typeof loader>();

  return (
    <div className='landing-page relative min-h-screen overflow-x-hidden'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Hero />
      <div className='section-auto'>
        <Features />
      </div>
      <div className='section-auto'>
        <Workflow />
      </div>
      <div className='section-auto'>
        <UseCases />
      </div>
      <div className='section-auto'>
        <ValueProposition />
      </div>
      <div className='section-auto'>
        <Feedbacks />
      </div>
      <div className='section-auto'>
        <CTA />
      </div>
    </div>
  );
}
