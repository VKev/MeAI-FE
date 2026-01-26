import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { clientFetch } from '@/services/client/api.client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoMeAI from '@/assets/logo-meai.png';

type PurchaseResponse = {
  value: {
    subscriptionId: string;
    cost: number;
    currency: string;
    amount: number;
    clientSecret: string;
  };
  isSuccess: boolean;
  error: {
    description: string;
  };
};

export default function StripeCheckout() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptionsClient
  });

  const plan = subscriptionsData?.value?.find((p) => p.id === planId);

  const purchaseMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return clientFetch<PurchaseResponse>(
        `/api/User/subscriptions/${subscriptionId}/purchase`,
        {
          method: 'POST',
          data: { paymentMethodId: null, renew: true }
        },
        { auth: true }
      );
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) {
        navigate(`/auth/sign-in?redirectTo=/checkout/${planId}`);
        return;
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to create payment');
    }
  });

  useEffect(() => {
    if (planId && !purchaseMutation.data && !purchaseMutation.isPending && !purchaseMutation.isError) {
      purchaseMutation.mutate(planId);
    }
  }, [planId]);

  const handlePaymentSuccess = () => {
    navigate('/user/dashboard');
  };

  const handlePaymentCancel = () => {
    navigate(-1);
  };

  const paymentData = purchaseMutation.data;

  // Loading state
  if (purchaseMutation.isPending || !paymentData) {
    return (
      <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-400' />
          </div>
          <p className='text-slate-400'>Preparing checkout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentData?.isSuccess) {
    return (
      <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center'>
          <div className='bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl'>
            <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6'>
              <p className='text-red-400'>
                {error || paymentData?.error?.description || 'Failed to create payment session'}
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

  const formatPrice = (cost: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(cost);
  };

  const planDetails = plan ? [{ label: plan.name, value: formatPrice(plan.cost), sublabel: 'Billed monthly' }] : [];

  return (
    <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden'>
      {/* Background glow effects */}
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl' />
      {/* Stripe Logo */}
      <div className='relative pt-8 pb-6 text-center'>
        <h1
          className='text-5xl font-bold text-transparent bg-clip-text bg-indigo-600 tracking-tight'
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          stripe
        </h1>
      </div>

      {/* Main Container */}
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
              </div>

              <div className='mb-6'>
                <p className='text-slate-400 text-sm mb-1'>Subscribe to</p>
                <h2 className='text-xl font-bold text-white'>{plan?.name || 'Subscription'}</h2>
              </div>

              {/* Price Display */}
              <div className='flex items-baseline gap-2 mb-8'>
                <span className='text-4xl font-bold text-purple-400'>{formatPrice(paymentData.value.amount)}</span>
                <div className='text-slate-400 text-sm'>
                  <span>per</span>
                  <div>
                    {plan?.durationMonths || 1} month{(plan?.durationMonths || 1) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Plan Details Table */}
              <div className='border-t border-neutral-700 pt-6 space-y-4'>
                {plan && (
                  <>
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='font-medium text-white'>{plan.name}</p>
                        <p className='text-sm text-slate-400'>
                          Billed per {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className='font-medium text-white'>{formatPrice(plan.cost)}</p>
                    </div>
                    <div className='flex justify-between py-2'>
                      <p className='text-slate-400'>Subtotal</p>
                      <p className='font-medium text-white'>{formatPrice(plan.cost)}</p>
                    </div>
                    <div className='flex justify-between py-2 text-sm'>
                      <p className='text-slate-500'>Tax</p>
                      <p className='text-slate-500'>₫0</p>
                    </div>
                    <div className='flex justify-between pt-4 border-t border-neutral-700'>
                      <p className='font-semibold text-white'>Total due today</p>
                      <p className='font-bold text-purple-400 text-lg'>{formatPrice(paymentData.value.amount)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className='bg-neutral-900/50 p-8 lg:p-10'>
              <StripeProvider clientSecret={paymentData.value.clientSecret}>
                <PaymentForm
                  amount={paymentData.value.amount}
                  currency={paymentData.value.currency}
                  planName={plan?.name || 'Subscription'}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
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
        </div>
      </div>
    </div>
  );
}
