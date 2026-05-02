import { useLoaderData, useNavigate, redirect, type LoaderFunctionArgs } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { fetchSubscriptionsClient, fetchMySubscriptionsClient } from '@/services/client/subscription.client';
import { createStripePurchaseClient } from '@/services/client/stripe.client';
import { getUser } from '@/services/server/session.server';
import type { Subscription } from '@/models/subscription.model';
import type { StripeConfirmPurchaseResponse, StripePurchaseResponse } from '@/models/stripe.model';

type LoaderData = {
  planId: string;
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<LoaderData> {
  const planId = params.planId;

  if (!planId) {
    throw new Response('Subscription plan is required.', { status: 400 });
  }

  const user = await getUser(request);
  if (!user) {
    throw redirect(`/auth/sign-in?redirectTo=/checkout/${planId}`);
  }

  return { planId };
}

export function shouldRevalidate() {
  return false;
}

export default function StripeCheckout() {
  const navigate = useNavigate();
  const { planId } = useLoaderData<typeof loader>();
  
  const [paymentData, setPaymentData] = useState<StripePurchaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const { data: subsData, isLoading: isSubsLoading } = useQuery({
    queryKey: ['public-subscriptions'],
    queryFn: fetchSubscriptionsClient,
    staleTime: 5 * 60_000
  });

  const { data: userSubsData, isLoading: isUserSubsLoading } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: fetchMySubscriptionsClient,
    staleTime: 5 * 60_000
  });

  const plan = subsData?.value?.find((item) => item.id === planId) ?? null;

  useEffect(() => {
    if (isSubsLoading || isUserSubsLoading) return;
    if (hasInitialized.current) return;

    if (!plan) {
      setError('Subscription plan not found.');
      hasInitialized.current = true;
      return;
    }

    const currentSubscription = userSubsData?.value?.find((item) => item.isCurrent) ?? null;
    const scheduledSubscription = userSubsData?.value?.find((item) => item.isScheduled) ?? null;

    if (currentSubscription?.subscriptionId === planId) {
      setError(`Your ${currentSubscription.subscriptionName || 'selected'} plan is already active.`);
      hasInitialized.current = true;
      return;
    }

    if (scheduledSubscription?.subscriptionId === planId) {
      setError(`Your ${scheduledSubscription.subscriptionName || 'selected'} plan is already scheduled to start on ${formatDate(scheduledSubscription.activeDate)}.`);
      hasInitialized.current = true;
      return;
    }

    if (scheduledSubscription) {
      setError(`You already have ${scheduledSubscription.subscriptionName || 'another plan'} scheduled for the next renewal on ${formatDate(scheduledSubscription.activeDate)}.`);
      hasInitialized.current = true;
      return;
    }

    hasInitialized.current = true;

    createStripePurchaseClient(planId)
      .then((res) => {
        if (!res.isSuccess) {
           setError(res.error.description || 'Failed to create payment session.');
        } else {
           const completedWithoutPayment = !res.value.requiresPayment && (res.value.subscriptionActivated || res.value.scheduledChangeCreated);
           if (!completedWithoutPayment && !res.value.requiresPayment) {
             setError('Unable to complete this subscription change.');
           }
        }
        setPaymentData(res);
      })
      .catch((err) => {
        setError(err.message || 'Failed to create payment session.');
      });
  }, [isSubsLoading, isUserSubsLoading, planId, plan, userSubsData]);

  const completedWithoutPayment =
    paymentData?.isSuccess &&
    !paymentData.value.requiresPayment &&
    (paymentData.value.subscriptionActivated || paymentData.value.scheduledChangeCreated);

  const handlePaymentSuccess = (result: StripeConfirmPurchaseResponse['value']) => {
    navigate(result.scheduledChangeCreated ? '/user/plans' : '/user/dashboard');
  };

  const handlePaymentCancel = () => {
    navigate('/user/plans');
  };

  if (!paymentData && !error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-400' />
          </div>
          <p className='text-slate-400'>Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (completedWithoutPayment && paymentData?.isSuccess) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4'>
        <div className='max-w-xl w-full text-center'>
          <div className='bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl'>
            <div className='mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4'>
              <p className='text-sm font-medium text-emerald-200'>
                {paymentData.value.scheduledChangeCreated
                  ? 'Your recurring plan change has been scheduled.'
                  : paymentData.value.changeType === 'upgrade'
                    ? 'Your upgrade is active now.'
                    : 'Your recurring subscription is active now.'}
              </p>
              <p className='mt-2 text-sm text-emerald-100/80'>
                {paymentData.value.scheduledChangeCreated
                  ? `The switch happens on ${formatDate(paymentData.value.effectiveDate)}.`
                  : `Current billing period started ${formatDate(paymentData.value.effectiveDate)}.`}
              </p>
            </div>

            <div className='space-y-3 text-left text-sm text-slate-300'>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3'>
                <span>Plan</span>
                <span className='font-medium text-white'>{plan?.name || 'Subscription'}</span>
              </div>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3'>
                <span>Today's charge</span>
                <span className='font-medium text-white'>{formatPrice(paymentData.value.amount)}</span>
              </div>
              {paymentData.value.creditApplied > 0 && (
                <div className='flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3'>
                  <span>Upgrade credit applied</span>
                  <span className='font-medium text-sky-100'>{formatPrice(paymentData.value.creditApplied)}</span>
                </div>
              )}
            </div>

            <div className='mt-6 flex flex-col gap-3'>
              <Button
                onClick={() => navigate(paymentData.value.scheduledChangeCreated ? '/user/plans' : '/user/dashboard')}
                className='bg-violet-600 hover:bg-violet-700 text-white'
              >
                {paymentData.value.scheduledChangeCreated ? 'Back to Plans' : 'Go to Dashboard'}
              </Button>
              <Button
                variant='outline'
                onClick={() => navigate('/user/billing-history')}
                className='border-neutral-600 text-white hover:bg-neutral-800 hover:text-white'
              >
                Open Billing History
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentData?.isSuccess || (paymentData.value.requiresPayment && !paymentData.value.clientSecret)) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center'>
          <div className='bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl'>
            <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6'>
              <p className='text-red-400'>
                {error || paymentData?.error?.description || 'Failed to create payment session.'}
              </p>
            </div>
            <Button onClick={() => navigate('/user/plans')} className='bg-violet-600 hover:bg-violet-700 text-white'>
              Back to Pricing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden'>
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl' />

      <div className='relative pt-8 pb-6 text-center'>
        <h1
          className='text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight'
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          stripe
        </h1>
      </div>

      <div className='relative px-4 pb-8'>
        <div className='max-w-5xl mx-auto bg-neutral-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-neutral-700/50'>
          <div className='grid grid-cols-1 lg:grid-cols-2'>
            <div className='bg-neutral-800/50 p-8 lg:p-10 border-r border-neutral-700/50'>
              <div className='flex items-center gap-2 mb-8'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handlePaymentCancel}
                  className='text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 -ml-2 p-2 h-auto'
                >
                  <ArrowLeft className='w-4 h-4' />
                </Button>
                <img src='/logo-meai.webp' alt='MeAI' className='h-12 w-auto' />
              </div>

              <div className='mb-6'>
                <p className='text-slate-400 text-sm mb-1'>
                  {paymentData.value.changeType === 'upgrade'
                    ? 'Upgrade recurring plan to'
                    : paymentData.value.changeType === 'scheduled_change'
                      ? 'Change recurring plan to'
                      : 'Start recurring plan'}
                </p>
                <h2 className='text-xl font-bold text-white'>{plan?.name || 'Subscription'}</h2>
              </div>

              <div className='flex items-baseline gap-2 mb-8'>
                <span className='text-4xl font-bold text-purple-400'>{formatPrice(paymentData.value.amount)}</span>
                <div className='text-slate-400 text-sm'>
                  <span>{paymentData.value.changeType === 'scheduled_change' ? 'charged' : 'due'}</span>
                  <div>today</div>
                </div>
              </div>

              <div className='border-t border-neutral-700 pt-6 space-y-4'>
                {plan && (
                  <>
                    {paymentData.value.changeType === 'upgrade' && (
                      <div className='rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100'>
                        Your billing cycle stays the same. MeAI coins for this cycle only top up by the difference
                        between your current plan and the upgraded plan.
                      </div>
                    )}
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='font-medium text-white'>{plan.name}</p>
                        <p className='text-sm text-slate-400'>
                          {paymentData.value.changeType === 'scheduled_change'
                            ? 'No charge today. Future renewals switch to this plan on the next billing date.'
                            : paymentData.value.changeType === 'upgrade'
                              ? 'Starts now after payment confirmation and keeps renewing on the new plan.'
                              : 'Starts now after payment confirmation and renews automatically each billing cycle.'}
                        </p>
                      </div>
                      <p className='font-medium text-white'>{formatPrice(plan.cost)}</p>
                    </div>
                    <div className='flex justify-between py-2'>
                      <p className='text-slate-400'>Plan price</p>
                      <p className='font-medium text-white'>{formatPrice(plan.cost)}</p>
                    </div>
                    {paymentData.value.creditApplied > 0 && (
                      <div className='flex justify-between py-2 text-sm'>
                        <p className='text-slate-400'>Proration credit</p>
                        <p className='font-medium text-sky-100'>- {formatPrice(paymentData.value.creditApplied)}</p>
                      </div>
                    )}
                    <div className='flex justify-between py-2 text-sm'>
                      <p className='text-slate-500'>
                        {paymentData.value.changeType === 'scheduled_change'
                          ? 'Plan change date'
                          : 'Current period start'}
                      </p>
                      <p className='text-slate-400'>{formatDate(paymentData.value.effectiveDate)}</p>
                    </div>
                    <div className='flex justify-between pt-4 border-t border-neutral-700'>
                      <p className='font-semibold text-white'>Total due today</p>
                      <p className='font-bold text-purple-400 text-lg'>{formatPrice(paymentData.value.amount)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className='bg-neutral-900/50 p-8 lg:p-10'>
              <StripeProvider clientSecret={paymentData.value.clientSecret!}>
                <PaymentForm
                  amount={paymentData.value.amount}
                  currency={paymentData.value.currency}
                  changeType={paymentData.value.changeType}
                  effectiveDate={paymentData.value.effectiveDate}
                  planId={planId}
                  planName={plan?.name || 'Subscription'}
                  paymentIntentId={paymentData.value.paymentIntentId}
                  renew={paymentData.value.renew}
                  stripeSubscriptionId={paymentData.value.stripeSubscriptionId}
                  transactionId={paymentData.value.transactionId}
                  onCancel={handlePaymentCancel}
                  onSuccess={handlePaymentSuccess}
                  lightMode={false}
                />
              </StripeProvider>
            </div>
          </div>
        </div>
      </div>

      <div className='relative text-center pb-8'>
        <div className='flex items-center justify-center gap-4 text-sm text-slate-500'>
          <span>
            Powered by <span className='font-semibold text-slate-400'>stripe</span>
          </span>
          <span>|</span>
          <a href='#' className='hover:text-purple-400 transition-colors'>
            Terms
          </a>
          <a href='#' className='hover:text-purple-400 transition-colors'>
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
}

function formatPrice(cost: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(cost);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'the next billing date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}
