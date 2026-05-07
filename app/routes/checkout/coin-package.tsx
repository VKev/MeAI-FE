import { useLocation, useNavigate, redirect, type LoaderFunctionArgs } from 'react-router';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeProvider, PaymentForm } from '@/components/stripe';
import { useEffect, useState, useRef } from 'react';
import { getUser } from '@/services/server/session.server';
import type { CoinPackage } from '@/models/coin-package.model';
import { resolveCoinPackageCheckoutClient } from '@/services/client/coin-package.client';
import { useRefetchUser } from '@/utils/user-state';

type LocationState = {
  clientSecret: string;
  paymentIntentId: string;
  transactionId: string;
  coinPackage: CoinPackage;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/auth/sign-in?redirectTo=/checkout/coin-package');
  }
  return null;
}

export function shouldRevalidate() {
  return false;
}

export default function CoinPackageCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const refetchUser = useRefetchUser();

  const state = location.state as LocationState;
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!state || !state.clientSecret || !state.paymentIntentId || !state.transactionId || !state.coinPackage) {
      setError('Invalid checkout session. Please try again.');
    }
  }, [state]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePaymentSuccess = async (result: any) => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    setIsProcessing(true);
    try {
      // Resolve the checkout
      const resolveResponse = await resolveCoinPackageCheckoutClient({
        paymentIntentId: state.paymentIntentId,
        transactionId: state.transactionId
      });

      if (resolveResponse.isSuccess) {
        // Refetch user to update coin balance
        void refetchUser();

        // Navigate to success page or back to plans
        navigate('/user/plans', {
          state: {
            coinPurchaseSuccess: true,
            coinsAdded: resolveResponse.value.coinsAdded,
            newBalance: resolveResponse.value.newBalance
          }
        });
      } else {
        setError(resolveResponse.error?.description || 'Failed to process payment confirmation.');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError('An error occurred while confirming your payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    navigate('/user/plans');
  };

  if (!state || error) {
    return (
      <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center'>
          <div className='bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl'>
            <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6'>
              <p className='text-red-400'>{error || 'Invalid checkout session. Please try again.'}</p>
            </div>
            <Button onClick={() => navigate('/user/plans')} className='bg-violet-600 hover:bg-violet-700 text-white'>
              Back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden'>
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl' />

      <div className='relative pt-8 pb-6 text-center'>
        <h1
          className='text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400 tracking-tight'
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
                  className='text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 -ml-2 p-2 h-auto'
                >
                  <ArrowLeft className='w-4 h-4' />
                </Button>
                <img src='/logo-meai.webp' alt='MeAI' className='h-12 w-auto' />
              </div>

              <div className='mb-6'>
                <p className='text-slate-400 text-sm mb-1'>Purchase coin package</p>
                <h2 className='text-xl font-bold text-white'>{state.coinPackage.name}</h2>
              </div>

              <div className='flex items-baseline gap-2 mb-8'>
                <span className='text-4xl font-bold text-blue-400'>{formatPrice(state.coinPackage.price)}</span>
                <div className='text-slate-400 text-sm'>
                  <span>one-time</span>
                  <div>payment</div>
                </div>
              </div>

              <div className='border-t border-neutral-700 pt-6 space-y-4'>
                <div className='rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100'>
                  <p className='font-medium text-white'>Instant coin delivery</p>
                  <p className='mt-1 text-blue-100/80'>
                    Coins will be added to your account immediately after successful payment.
                  </p>
                </div>

                <div className='flex justify-between items-start'>
                  <div>
                    <p className='font-medium text-white'>{state.coinPackage.name}</p>
                    <p className='text-sm text-slate-400'>
                      One-time purchase of {state.coinPackage.totalCoins.toLocaleString()} coins
                    </p>
                  </div>
                  <p className='font-medium text-white'>{formatPrice(state.coinPackage.price)}</p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2.5 text-slate-300 text-sm'>
                    <Check className='w-4 h-4 text-green-500 shrink-0' />
                    <span>{state.coinPackage.coinAmount.toLocaleString()} base coins</span>
                  </div>
                  {state.coinPackage.bonusCoins > 0 && (
                    <div className='flex items-center gap-2.5 text-slate-300 text-sm'>
                      <Check className='w-4 h-4 text-amber-500 shrink-0' />
                      <span>{state.coinPackage.bonusCoins.toLocaleString()} bonus coins</span>
                    </div>
                  )}
                  <div className='flex items-center gap-2.5 text-slate-300 text-sm'>
                    <Check className='w-4 h-4 text-blue-500 shrink-0' />
                    <span>Total: {state.coinPackage.totalCoins.toLocaleString()} coins</span>
                  </div>
                </div>

                <div className='flex justify-between pt-4 border-t border-neutral-700'>
                  <p className='font-semibold text-white'>Total due today</p>
                  <p className='font-bold text-blue-400 text-lg'>{formatPrice(state.coinPackage.price)}</p>
                </div>
              </div>
            </div>

            <div className='bg-neutral-900/50 p-8 lg:p-10'>
              <StripeProvider clientSecret={state.clientSecret}>
                <PaymentForm
                  amount={state.coinPackage.price}
                  currency={state.coinPackage.currency}
                  changeType='new_purchase'
                  effectiveDate={new Date().toISOString()}
                  planId={state.coinPackage.id}
                  planName={state.coinPackage.name}
                  paymentIntentId={state.paymentIntentId}
                  renew={false}
                  stripeSubscriptionId={null}
                  transactionId={state.transactionId}
                  onCancel={handlePaymentCancel}
                  onSuccess={handlePaymentSuccess}
                  lightMode={false}
                />
              </StripeProvider>

              {isProcessing && (
                <div className='mt-4 flex items-center justify-center gap-2 text-sm text-slate-400'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Processing your coin purchase...</span>
                </div>
              )}
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
          <a href='#' className='hover:text-blue-400 transition-colors'>
            Terms
          </a>
          <a href='#' className='hover:text-blue-400 transition-colors'>
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
}
