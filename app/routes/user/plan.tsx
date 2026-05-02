import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from 'react-router';
import type { CurrentUserSubscription, Subscription } from '@/models/subscription.model';
import { fetchMySubscriptions, fetchSubscriptions } from '@/services/server/subscription.server';
import { Check, Crown, Zap, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlanActionState } from '@/utils/subscription-flow';
import { useCurrentUser } from '@/utils/user-state';

type LoaderData = {
  subscriptions: Subscription[];
  userSubscriptions: CurrentUserSubscription[];
  error: string | null;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  try {
    const [subscriptionsResult, userSubscriptionsResult] = await Promise.all([
      fetchSubscriptions(request),
      fetchMySubscriptions(request).catch(() => null)
    ]);

    const subsArray = Array.isArray(subscriptionsResult) ? subscriptionsResult : (subscriptionsResult.value ?? []);

    return {
      subscriptions: subsArray,
      userSubscriptions: userSubscriptionsResult?.value ?? [],
      error: null
    };
  } catch (error) {
    return {
      subscriptions: [],
      userSubscriptions: [],
      error: error instanceof Error ? error.message : 'Failed to load subscriptions.'
    };
  }
}

export default function Plan() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { subscriptions, userSubscriptions, error } = useLoaderData<typeof loader>();
  const user = useCurrentUser();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (navigation.state === 'idle') {
      setPendingPlanId(null);
    }
  }, [navigation.state]);

  const currentSubscription = userSubscriptions.find((item) => item.isCurrent) ?? null;
  const scheduledSubscription = userSubscriptions.find((item) => item.isScheduled) ?? null;
  const currentPlan = subscriptions.find((item) => item.id === currentSubscription?.subscriptionId) ?? null;
  const redirectingPlanId = getCheckoutPlanId(navigation.location?.pathname) ?? pendingPlanId;
  const isRedirectingToCheckout = Boolean(redirectingPlanId);

  const handleSubscribeClick = (planId: string) => {
    if (isRedirectingToCheckout) {
      return;
    }

    setPendingPlanId(planId);
    navigate(`/checkout/${planId}`);
  };

  return (
    <div className='min-h-screen py-8 px-6'>
      {/* Header */}
      <div className='mb-10'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
            <Crown className='w-5 h-5 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Subscription Plans</h1>
        </div>
        <p className='text-slate-400 ml-13'>
          Choose the plan that best fits your needs. Upgrade or change your subscription anytime.
        </p>
      </div>

      {/* Current Plan Info */}
      {user && (
        <div className='mb-8 p-5 bg-linear-to-r from-violet-500/10 to-purple-600/10 rounded-xl border border-violet-500/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-white'>Welcome back, {user.fullName || user.username}!</h3>
                <p className='text-sm text-slate-400'>
                  <span className='text-violet-400 font-medium'>{user.meAiCoin || 0}</span> MeAI Coins available
                </p>
              </div>
            </div>
            <div className='text-right'>
              <div className='flex items-center justify-end gap-2'>
                <CreditCard className='w-4 h-4 text-slate-400' />
                <span className='text-sm text-slate-400'>
                  {currentSubscription ? 'Current plan' : 'Manage billing'}
                </span>
              </div>
              {currentSubscription && (
                <>
                  <p className='mt-1 text-sm font-medium text-white'>
                    {currentSubscription.subscriptionName || 'Active subscription'}
                  </p>
                  <p className='text-xs text-slate-400'>
                    Renews automatically on {formatDate(currentSubscription.endDate)}
                  </p>
                </>
              )}
            </div>
          </div>
          {scheduledSubscription && (
            <div className='mt-4 border-t border-white/10 pt-4'>
              <p className='text-xs font-medium uppercase tracking-[0.18em] text-slate-500'>Scheduled plan change</p>
              <div className='mt-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100'>
                <p className='font-medium text-white'>{scheduledSubscription.subscriptionName || 'Next plan'}</p>
                <p className='mt-1 text-sky-100/80'>
                  Switches on {formatDate(scheduledSubscription.activeDate)} at your next renewal.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center'>
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      {!error && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {subscriptions.map((plan: Subscription, index: number) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              currentSubscription={currentSubscription}
              scheduledSubscription={scheduledSubscription}
              isPopular={index === 1}
              isRedirecting={redirectingPlanId === plan.id}
              isInteractionLocked={isRedirectingToCheckout}
              onSubscribeClick={handleSubscribeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PricingCard({
  plan,
  currentPlan,
  currentSubscription,
  scheduledSubscription,
  isPopular,
  isRedirecting,
  isInteractionLocked,
  onSubscribeClick
}: {
  plan: Subscription;
  currentPlan: Subscription | null;
  currentSubscription: CurrentUserSubscription | null;
  scheduledSubscription: CurrentUserSubscription | null;
  isPopular?: boolean;
  isRedirecting: boolean;
  isInteractionLocked: boolean;
  onSubscribeClick: (planId: string) => void;
}) {
  const features = [`${plan.limits?.number_of_social_accounts ?? 1} Social Accounts`, `${plan.meAiCoin} MeAI Coins`];

  const formatPrice = (cost: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(cost);
  };

  const handleClick = () => {
    onSubscribeClick(plan.id);
  };

  const actionState = getPlanActionState(plan, currentPlan, currentSubscription, scheduledSubscription);
  const isCurrentPlan = actionState === 'current';
  const isScheduledPlan = actionState === 'scheduled';
  const buttonLabel = isRedirecting
    ? 'Redirecting...'
    : actionState === 'current'
      ? 'Current Plan'
      : actionState === 'scheduled'
        ? 'Scheduled Change'
        : actionState === 'upgrade'
          ? 'Upgrade Now'
          : actionState === 'schedule'
            ? 'Change At Renewal'
            : actionState === 'locked'
              ? 'Change Locked'
              : 'Subscribe Now';
  const buttonDisabled =
    actionState === 'current' || actionState === 'scheduled' || actionState === 'locked' || isInteractionLocked;

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
        isPopular
          ? 'bg-linear-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500'
          : 'bg-neutral-800/50 border border-neutral-700'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-linear-to-r from-violet-600 to-purple-600 rounded-full text-xs font-semibold text-white flex items-center gap-1'>
          <Zap className='w-3 h-3' />
          Most Popular
        </div>
      )}

      {isCurrentPlan && (
        <div className='absolute right-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300'>
          Active plan
        </div>
      )}

      {isScheduledPlan && (
        <div className='absolute right-4 top-4 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-200'>
          Changes next
        </div>
      )}

      {/* Plan Name */}
      <h3 className='text-xl font-bold text-white mb-1'>{plan.name}</h3>

      {/* Duration */}
      <p className='text-slate-400 text-sm mb-4'>
        {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
      </p>

      {/* Price */}
      <div className='mb-5'>
        <span className='text-3xl font-bold text-white'>{formatPrice(plan.cost)}</span>
        <span className='text-slate-400 ml-2'>/ {plan.durationMonths}mo</span>
      </div>

      {(isCurrentPlan ||
        isScheduledPlan ||
        actionState === 'upgrade' ||
        actionState === 'schedule' ||
        actionState === 'locked') && (
        <p
          className={`mb-5 rounded-lg px-3 py-2 text-sm ${
            isCurrentPlan
              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : isScheduledPlan
                ? 'border border-sky-500/20 bg-sky-500/10 text-sky-100'
                : 'border border-white/10 bg-white/5 text-slate-300'
          }`}
        >
          {isCurrentPlan
            ? `Renews automatically on ${formatDate(currentSubscription?.endDate)}`
            : isScheduledPlan
              ? `Switches on ${formatDate(scheduledSubscription?.activeDate)} at your next renewal`
              : actionState === 'upgrade'
                ? 'Stripe prorates the remaining time on your current plan and bills the difference now.'
                : actionState === 'schedule'
                  ? 'No charge today. Stripe will switch your recurring plan on the next renewal date.'
                  : 'A recurring plan change is already scheduled for the next renewal.'}
        </p>
      )}

      {/* Features */}
      <ul className='space-y-2.5 mb-6'>
        {features.map((feature, idx) => (
          <li key={idx} className='flex items-center gap-2.5 text-slate-300 text-sm'>
            <Check className='w-4 h-4 text-green-500 shrink-0' />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Subscribe Button */}
      <Button
        onClick={handleClick}
        disabled={buttonDisabled}
        className={`w-full py-2.5 font-medium transition-all duration-300 ${
          isPopular
            ? 'bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30'
            : 'bg-neutral-700 text-white hover:bg-neutral-600'
        }`}
      >
        {buttonLabel}
      </Button>
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
