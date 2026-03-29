import { useLoaderData, useNavigate, redirect, type LoaderFunctionArgs } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { fetchCurrentSubscription, fetchSubscriptions } from '@/services/server/subscription.server';
import { createStripePurchase } from '@/services/server/stripe.server';
import { getUser } from '@/services/server/session.server';
import type { Subscription } from '@/models/subscription.model';
import type { StripePurchaseResponse } from '@/models/stripe.model';

type LoaderData = {
  planId: string;
  plan: Subscription | null;
  paymentData: StripePurchaseResponse | null;
  error: string | null;
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

  try {
    const [subscriptionsData, currentSubscriptionData] = await Promise.all([
      fetchSubscriptions(request),
      fetchCurrentSubscription(request).catch(() => null)
    ]);
    const plan = subscriptionsData.value?.find((item) => item.id === planId) ?? null;

    if (!plan) {
      return {
        planId,
        plan: null,
        paymentData: null,
        error: 'Subscription plan not found.'
      };
    }

    const currentSubscription = currentSubscriptionData?.value ?? null;

    if (currentSubscription?.isActive && currentSubscription.subscriptionId === planId) {
      return {
        planId,
        plan,
        paymentData: null,
        error: `Your ${currentSubscription.subscriptionName || 'selected'} plan is already active.`
      };
    }

    const paymentData = await createStripePurchase(request, planId);

    return {
      planId,
      plan,
      paymentData,
      error: paymentData.isSuccess ? null : paymentData.error.description || 'Failed to create payment session.'
    };
  } catch (error) {
    return {
      planId,
      plan: null,
      paymentData: null,
      error: error instanceof Error ? error.message : 'Failed to create payment session.'
    };
  }
}

export function shouldRevalidate() {
  return false;
}

export default function StripeCheckout() {
  const navigate = useNavigate();
  const { planId, plan, paymentData, error } = useLoaderData<typeof loader>();

  const handlePaymentSuccess = () => {
    navigate('/user/dashboard');
  };

  const handlePaymentCancel = () => {
    navigate('/user/plans');
  };

  if (!paymentData && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
          <p className="text-slate-400">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentData?.isSuccess || !paymentData?.value.clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400">
                {error || paymentData?.error?.description || 'Failed to create payment session.'}
              </p>
            </div>
            <Button onClick={() => navigate('/user/plans')} className="bg-violet-600 hover:bg-violet-700 text-white">
              Back to Pricing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (cost: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cost);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />

      <div className="relative pt-8 pb-6 text-center">
        <h1
          className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          stripe
        </h1>
      </div>

      <div className="relative px-4 pb-8">
        <div className="max-w-5xl mx-auto bg-neutral-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-neutral-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-neutral-800/50 p-8 lg:p-10 border-r border-neutral-700/50">
              <div className="flex items-center gap-2 mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaymentCancel}
                  className="text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 -ml-2 p-2 h-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <img src="/logo-meai.webp" alt="MeAI" className="h-12 w-auto" />
              </div>

              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-1">Subscribe to</p>
                <h2 className="text-xl font-bold text-white">{plan?.name || 'Subscription'}</h2>
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-bold text-purple-400">
                  {formatPrice(paymentData.value.amount)}
                </span>
                <div className="text-slate-400 text-sm">
                  <span>per</span>
                  <div>
                    {plan?.durationMonths || 1} month{(plan?.durationMonths || 1) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6 space-y-4">
                {plan && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">{plan.name}</p>
                        <p className="text-sm text-slate-400">
                          Billed per {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-medium text-white">{formatPrice(plan.cost)}</p>
                    </div>
                    <div className="flex justify-between py-2">
                      <p className="text-slate-400">Subtotal</p>
                      <p className="font-medium text-white">{formatPrice(plan.cost)}</p>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <p className="text-slate-500">Tax</p>
                      <p className="text-slate-500">₫0</p>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-neutral-700">
                      <p className="font-semibold text-white">Total due today</p>
                      <p className="font-bold text-purple-400 text-lg">
                        {formatPrice(paymentData.value.amount)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-neutral-900/50 p-8 lg:p-10">
              <StripeProvider clientSecret={paymentData.value.clientSecret}>
                <PaymentForm
                  amount={paymentData.value.amount}
                  currency={paymentData.value.currency}
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

      <div className="relative text-center pb-8">
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          <span>
            Powered by <span className="font-semibold text-slate-400">stripe</span>
          </span>
          <span>|</span>
          <a href="#" className="hover:text-purple-400 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
}
