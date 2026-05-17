import type { Route } from './+types/pricing';
import { Link, useLoaderData, useNavigate, useNavigation } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  LogIn,
  ShieldCheck,
  Sparkles,
  Zap,
  Share2,
  Building,
  Coins,
  HardDrive,
  Trash2
} from 'lucide-react';
import type { Subscription } from '@/models/subscription.model';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { getUser } from '@/services/server/session.server';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/utils/user-state';

type PricingLoaderData = {
  hasSession: boolean;
  pageUrl: string;
  imageUrl: string;
  schema: {
    '@context': string;
    '@graph': Array<Record<string, unknown>>;
  };
};

const pricingAssurances = [
  {
    title: 'Cancel anytime',
    description: 'No long contract lock-in. Upgrade or cancel when your workflow changes.'
  },
  {
    title: 'Secure checkout',
    description: 'Billing runs through Stripe and every transaction is encrypted end-to-end.'
  },
  {
    title: 'Fast onboarding',
    description: 'Go from account setup to first campaign in minutes, not days.'
  }
] as const;

function formatPrice(cost: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(cost);
}

function getPlanDescriptor(plan: Subscription, index: number) {
  const normalizedName = plan.name.toLowerCase();

  if (normalizedName.includes('enterprise')) {
    return 'Built for high-volume teams with advanced operational capacity.';
  }
  if (normalizedName.includes('pro') || normalizedName.includes('business')) {
    return 'Ideal for growth teams managing multiple channels and campaigns.';
  }
  if (index === 0) {
    return 'A practical starting plan for creators launching consistent content.';
  }

  return 'Balanced plan for teams scaling production and distribution together.';
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;
  const user = await getUser(request).catch(() => null);

  return {
    hasSession: Boolean(user),
    pageUrl: `${origin}/pricing`,
    imageUrl: `${origin}/logo-meai.webp`,
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
          '@type': 'WebPage',
          name: 'MeAI Pricing',
          url: `${origin}/pricing`,
          description: 'Compare MeAI pricing plans for creators, teams, and agencies.'
        }
      ]
    }
  } satisfies PricingLoaderData;
}

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
});

export function shouldRevalidate() {
  return false;
}

export const links: Route.LinksFunction = () => [{ rel: 'canonical', href: '/pricing' }];

export function meta({ data }: Route.MetaArgs) {
  const routeData = data as PricingLoaderData | undefined;
  const pageUrl = routeData?.pageUrl ?? '/pricing';
  const imageUrl = routeData?.imageUrl ?? '/logo-meai.webp';

  return [
    { title: 'Pricing - MeAI' },
    {
      name: 'description',
      content: 'Explore MeAI pricing plans and choose the right setup for your AI-powered marketing workflow.'
    },
    {
      name: 'keywords',
      content: 'MeAI pricing, AI marketing pricing, creator subscription plans, social media automation pricing'
    },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'MeAI' },
    { property: 'og:title', content: 'MeAI Pricing - Plans for Every Growth Stage' },
    {
      property: 'og:description',
      content: 'Compare plan limits, workspace capacity, and credits to choose the best MeAI subscription.'
    },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'MeAI Pricing - Plans for Every Growth Stage' },
    { name: 'twitter:description', content: 'Find the right MeAI plan for creators, teams, and agencies.' },
    { name: 'twitter:image', content: imageUrl }
  ];
}

export default function Pricing() {
  const { schema } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const user = useCurrentUser();
  console.log('🚀 ~ Pricing ~ user:', user);

  const {
    data: subsData,
    isError: fetchFailed,
    isLoading: isSubsLoading
  } = useQuery({
    queryKey: ['public-subscriptions'],
    queryFn: () => fetchSubscriptionsClient()
  });

  const subscriptions = subsData?.value ?? [];
  const sortedPlans = useMemo(() => [...subscriptions].sort((a, b) => a.cost - b.cost), [subscriptions]);
  const featuredPlanId = sortedPlans.length > 1 ? sortedPlans[1].id : sortedPlans[0]?.id;
  const redirectingPlanId = getCheckoutPlanId(navigation.location?.pathname) ?? pendingPlanId;
  const isRedirectingToCheckout = Boolean(redirectingPlanId);

  useEffect(() => {
    if (navigation.state === 'idle') {
      setPendingPlanId(null);
    }
  }, [navigation.state]);

  const handleSubscribeClick = (planId: string) => {
    if (isRedirectingToCheckout) {
      return;
    }

    if (!user) {
      setSelectedPlanId(planId);
      setShowLoginDialog(true);
      return;
    }

    setPendingPlanId(planId);
    navigate(`/checkout/${planId}`);
  };

  const handleLogin = () => {
    const redirectUrl = selectedPlanId ? `/checkout/${selectedPlanId}` : '/pricing';
    navigate(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <div className='landing-page relative min-h-dvh overflow-x-hidden'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-balance'>
              <LogIn className='h-5 w-5 text-[#d88dff]' />
              Login Required
            </DialogTitle>
            <DialogDescription className='text-pretty text-slate-400'>
              Sign in to continue checkout. We will send you back to your selected pricing plan automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex gap-2 sm:gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowLoginDialog(false)}
              className='flex-1 border-white/20 bg-transparent text-slate-300 hover:bg-white/8 hover:text-white'
            >
              Stay Here
            </Button>
            <Button type='button' onClick={handleLogin} className='flex-1 bg-white text-black hover:bg-white/90'>
              <LogIn className='mr-2 h-4 w-4' />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className='relative border-b border-white/6 pt-28 pb-16 md:pt-36 md:pb-20'>
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute inset-0 landing-grid opacity-20' />
          <div className='absolute left-1/2 top-4 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(164,93,255,0.2),rgba(164,93,255,0)_74%)] blur-3xl' />
        </div>

        <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
          <div className='mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#11111a]/72 px-3 py-1.5 text-xs font-medium text-white/78'>
            <Sparkles className='h-3.5 w-3.5 text-[#d66bff]' />
            <span>Flexible plans for every growth stage</span>
          </div>

          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='text-balance text-5xl leading-[0.95] font-semibold text-white sm:text-6xl md:text-8xl'>
              Pricing built for
              <span className='block text-gradient-primary'>steady execution</span>
            </h1>

            <p className='text-pretty mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/62 md:text-2xl'>
              Pick the plan that matches your current publishing volume, then scale without reworking your stack.
            </p>
          </div>
        </div>
      </section>

      <section className='section-auto relative border-b border-white/6 py-14 md:py-20'>
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute inset-0 landing-grid opacity-12' />
        </div>

        <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
          {fetchFailed && (
            <div className='mb-6 rounded-2xl border border-amber-300/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-200'>
              Pricing data is temporarily unavailable. You can refresh this page or try again in a moment.
            </div>
          )}

          {isSubsLoading ? (
            <div className='flex justify-center items-center py-20'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent'></div>
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className='rounded-3xl border border-white/10 bg-[#090912]/76 p-8 text-center md:p-10'>
              <h2 className='text-balance text-3xl font-semibold text-white md:text-4xl'>
                No plans available right now
              </h2>
              <p className='text-pretty mx-auto mt-3 max-w-xl text-white/58'>
                We are updating pricing details. Reach out and we will recommend the best plan for your team.
              </p>
              <Link
                to='/contact'
                className='mt-7 inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8'
              >
                Contact sales
                <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
          ) : (
            <div className='grid gap-5 lg:grid-cols-3'>
              {sortedPlans.map((plan, index) => {
                const isFeatured = featuredPlanId === plan.id;

                return (
                  <SimplifiedPricingCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    isFeatured={isFeatured}
                    hasSession={!!user}
                    isRedirecting={redirectingPlanId === plan.id}
                    onSubscribeClick={handleSubscribeClick}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className='section-auto relative py-14 md:py-20'>
        <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
          <div className='mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11111a]/66 px-3 py-1 text-xs font-medium text-white/72'>
            <ShieldCheck className='h-3.5 w-3.5 text-[#dca3ff]' />
            What every plan includes
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            {pricingAssurances.map((item) => (
              <article key={item.title} className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6'>
                <h3 className='text-balance text-2xl font-semibold text-white'>{item.title}</h3>
                <p className='text-pretty mt-3 text-sm leading-relaxed text-white/58'>{item.description}</p>
              </article>
            ))}
          </div>

          <div className='mt-8 flex flex-wrap items-center gap-3'>
            <Link
              to='/auth/sign-in'
              className='inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90'
            >
              Start creating free
              <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              to='/contact'
              className='inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8'
            >
              <ShieldCheck className='h-4 w-4' />
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function getCheckoutPlanId(pathname?: string | null) {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(/^\/checkout\/([^/]+)$/);
  return match?.[1] ?? null;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'your billing period ends';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

function SimplifiedPricingCard({
  plan,
  index,
  isFeatured,
  hasSession,
  isRedirecting,
  onSubscribeClick
}: {
  plan: Subscription;
  index: number;
  isFeatured: boolean;
  hasSession: boolean;
  isRedirecting: boolean;
  onSubscribeClick: (planId: string) => void;
}) {
  const features = [
    {
      label: `${plan.limits?.number_of_social_accounts ?? 1} Social Accounts`,
      icon: <Share2 className='w-4 h-4 text-blue-500 shrink-0' />
    },
    {
      label: `${plan.limits?.number_of_workspaces ?? 0} Workspaces`,
      icon: <Building className='w-4 h-4 text-indigo-500 shrink-0' />
    },
    {
      label: `${plan.meAiCoin} MeAI Coins`,
      icon: <Coins className='w-4 h-4 text-yellow-500 shrink-0' />
    },
    {
      label: `${formatBytes(plan.limits?.storage_quota_bytes ?? 0)} Storage`,
      icon: <HardDrive className='w-4 h-4 text-purple-500 shrink-0' />
    },
    {
      label: `${plan.limits?.retention_days_after_delete ?? 30}d Data Retention`,
      icon: <Trash2 className='w-4 h-4 text-red-500 shrink-0' />
    }
  ];

  function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[28px] border px-6 py-6 transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transform-none md:px-7 md:py-7 ${
        isFeatured
          ? 'border-[#d37cff]/55 bg-[#130f1f]/82 shadow-[0_18px_44px_rgba(124,64,196,0.28)]'
          : 'border-white/10 bg-[#090912]/78'
      }`}
    >
      {isFeatured && (
        <div className='mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#d37cff]/45 bg-[#261833]/84 px-3 py-1 text-xs font-semibold text-[#e6b0ff]'>
          <Zap className='h-3.5 w-3.5' />
          Recommended
        </div>
      )}

      <p className='text-sm font-medium text-white/58'>{plan.name}</p>
      <h2 className='text-pretty mt-2 text-2xl font-semibold text-white md:text-3xl'>
        {getPlanDescriptor(plan, index)}
      </h2>

      <div className='mt-6 flex items-end gap-2'>
        <p className='text-4xl font-semibold tabular-nums text-white md:text-5xl'>{formatPrice(plan.cost)}</p>
        <p className='pb-1 text-sm text-white/58'>every {plan.durationMonths} month(s)</p>
      </div>

      <ul className='mt-6 space-y-3'>
        {features.map((f) => (
          <li key={f.label} className='flex items-start gap-2.5 text-sm text-white/72'>
            {f.icon}
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <div className='mt-6 rounded-2xl border border-white/10 bg-black/24 p-3'>
        <div className='flex items-center justify-between text-xs text-white/62'>
          <span>Plan duration</span>
          <span className='font-medium tabular-nums text-white/84'>{plan.durationMonths} months</span>
        </div>
        <div className='mt-2 flex items-center justify-between text-xs text-white/62'>
          <span>Included credits</span>
          <span className='font-medium tabular-nums text-white/84'>{plan.meAiCoin}</span>
        </div>
      </div>

      <div className='mt-6'>
        {hasSession ? (
          <Link
            to='/user/plans'
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${isFeatured ? 'bg-white text-black' : 'border border-white/14 text-white hover:bg-white/8'}`}
          >
            Go to my plans
          </Link>
        ) : (
          <Button
            type='button'
            onClick={() => onSubscribeClick(plan.id)}
            disabled={isRedirecting}
            className={`w-full py-2.5 font-medium ${isFeatured ? 'bg-white text-black' : 'bg-neutral-700 text-white'}`}
          >
            {isRedirecting ? 'Redirecting...' : `Start with ${plan.name}`}
          </Button>
        )}
      </div>
    </article>
  );
}
