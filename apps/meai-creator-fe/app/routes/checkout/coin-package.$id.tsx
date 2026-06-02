import { useEffect, useRef, useState } from 'react';
import { useLoaderData, useNavigate, type LoaderFunctionArgs, redirect } from 'react-router';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PaymentForm, StripeProvider } from '@/components/stripe';
import {
  checkoutCoinPackageClient,
  fetchCoinPackagesClient,
  resolveCoinPackageCheckoutClient
} from '@/services/client/coin-package.client';
import { fetchMySubscriptionsClient } from '@/services/client/subscription.client';
import { getUser } from '@/services/server/session.server';
import type {
  CoinPackage,
  CoinPackageCheckoutResponse,
  CoinPackageResolveCheckoutResponse
} from '@/models/coin-package.model';
import { useRefetchUser } from '@/utils/user-state';

type LoaderData = {
  packageId: string;
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<LoaderData> {
  const packageId = params.id?.trim() ?? '';

  if (!packageId) {
    throw new Response('Coin package is required.', { status: 400 });
  }

  const user = await getUser(request);
  if (!user) {
    throw redirect(`/auth/sign-in?redirectTo=/checkout/coin-package/${packageId}`);
  }

  return { packageId };
}

export function shouldRevalidate() {
  return false;
}

export default function CoinPackageCheckout() {
  const navigate = useNavigate();
  const refetchUser = useRefetchUser();
  const { packageId } = useLoaderData<typeof loader>();

  const hasInitialized = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(true);
  const [isDefaultCardSubmitting, setIsDefaultCardSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CoinPackageCheckoutResponse['value'] | null>(null);
  const [resolveData, setResolveData] = useState<CoinPackageResolveCheckoutResponse['value'] | null>(null);

  const { data: packagesData, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['coin-packages'],
    queryFn: () => fetchCoinPackagesClient(),
    staleTime: 5 * 60_000
  });

  const { data: userSubsData, isLoading: isUserSubsLoading } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: () => fetchMySubscriptionsClient(),
    staleTime: 5 * 60_000
  });

  const coinPackage = packagesData?.value?.find((item) => item.id === packageId) ?? null;
  const currentSubscription = userSubsData?.value?.find((item) => item.isCurrent) ?? null;
  const hasCurrentSubscription = Boolean(currentSubscription);

  useEffect(() => {
    if (isPackagesLoading || isUserSubsLoading) {
      return;
    }

    if (hasInitialized.current) {
      return;
    }

    if (!coinPackage) {
      setError('Coin package not found.');
      setIsPreparingCheckout(false);
      hasInitialized.current = true;
      return;
    }

    if (hasCurrentSubscription) {
      setIsPreparingCheckout(false);
      hasInitialized.current = true;
      return;
    }

    setIsPreparingCheckout(true);
    hasInitialized.current = true;

    void (async () => {
      try {
        const response = await checkoutCoinPackageClient(packageId);

        if (!response.isSuccess || !response.value) {
          setError(response.error?.description || 'Failed to prepare coin package checkout.');
          setIsPreparingCheckout(false);
          return;
        }

        setCheckoutData(response.value);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare coin package checkout.');
      } finally {
        setIsPreparingCheckout(false);
      }
    })();
  }, [coinPackage, hasCurrentSubscription, isPackagesLoading, isUserSubsLoading, packageId]);

  const buildResultUrl = (result: CoinPackageResolveCheckoutResponse['value']) => {
    const searchParams = new URLSearchParams();
    searchParams.set('packageId', coinPackage?.id ?? packageId);
    searchParams.set('transactionId', result.transactionId);
    searchParams.set('paymentIntentId', result.paymentIntentId);
    searchParams.set('creditedCoins', String(result.creditedCoins));
    searchParams.set('currentBalance', String(result.currentBalance));
    searchParams.set('status', result.status);
    searchParams.set('coinsCredited', String(result.coinsCredited));
    searchParams.set('alreadyCredited', String(result.alreadyCredited));

    return `/checkout/coin-package/result?${searchParams.toString()}`;
  };

  const finishCheckout = async (checkoutValue: CoinPackageCheckoutResponse['value'], useDefaultCard: boolean) => {
    if (isResolving) {
      return;
    }

    setIsResolving(true);
    try {
      const resolveResponse = await resolveCoinPackageCheckoutClient({
        paymentIntentId: checkoutValue.paymentIntentId,
        transactionId: checkoutValue.transactionId
      });

      if (!resolveResponse.isSuccess || !resolveResponse.value) {
        setError(resolveResponse.error?.description || 'Failed to finalize coin purchase.');
        return;
      }

      setResolveData(resolveResponse.value);
      void refetchUser();

      navigate(buildResultUrl(resolveResponse.value), {
        state: {
          coinPackage,
          checkoutData: checkoutValue,
          resolveData: resolveResponse.value,
          usedDefaultCard: useDefaultCard
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize coin purchase.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDefaultCardConfirm = async () => {
    if (!coinPackage || isDefaultCardSubmitting) {
      return;
    }

    setIsDefaultCardSubmitting(true);
    setError(null);

    try {
      const response = await checkoutCoinPackageClient(packageId, { useDefaultCard: true });

      if (!response.isSuccess || !response.value) {
        setError(response.error?.description || 'Failed to charge your saved card.');
        return;
      }

      await finishCheckout(response.value, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to charge your saved card.');
    } finally {
      setIsDefaultCardSubmitting(false);
    }
  };

  const handleStripePaymentSuccess = async () => {
    if (!checkoutData) {
      setError('Checkout session is missing. Please try again.');
      return;
    }

    await finishCheckout(checkoutData, false);
  };

  const handleCancel = () => {
    navigate('/user/plans');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, index)) * 100) / 100} ${sizes[index]}`;
  };

  if (
    isPackagesLoading ||
    isUserSubsLoading ||
    isPreparingCheckout ||
    (!hasCurrentSubscription && !checkoutData && !error)
  ) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20'>
            <Loader2 className='h-8 w-8 animate-spin text-violet-300' />
          </div>
          <p className='text-slate-400'>Preparing coin package checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !coinPackage) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='max-w-md w-full text-center'>
          <div className='rounded-[24px] bg-white/[0.035] p-8'>
            <div className='mb-6 rounded-[16px] bg-red-500/10 p-4'>
              <p className='text-red-400'>{error || 'Coin package not found.'}</p>
            </div>
            <Button onClick={handleCancel} className='rounded-[14px] bg-white text-black hover:bg-white/90'>
              Back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#050609]'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8'>
        <header className='mb-6 flex items-center gap-4'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
              <CreditCard className='h-5 w-5' />
            </div>

            <div className='space-y-0.5'>
              <h1 className='text-xl font-bold tracking-tight text-white'>Coin Package Checkout</h1>
              <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
                {hasCurrentSubscription
                  ? 'Confirm the purchase using your default saved card'
                  : 'Complete payment with Stripe to add coins'}
              </p>
            </div>
          </div>
        </header>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <section className='rounded-[24px] bg-white/[0.035] p-6 sm:p-8'>
            <div className='mb-6 flex items-start justify-between gap-4'>
              <div>
                <p className='text-sm text-slate-400'>Selected package</p>
                <h2 className='mt-1 text-2xl font-semibold text-white'>{coinPackage.name}</h2>
              </div>
              {coinPackage.bonusCoins > 0 && (
                <div className='rounded-[12px] bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200'>
                  <Sparkles className='mr-1 inline-block h-3 w-3' />
                  Best value
                </div>
              )}
            </div>

            <div className='mb-6 flex items-baseline gap-3'>
              <span className='text-4xl font-bold text-white'>{formatPrice(coinPackage.price)}</span>
              <span className='text-sm text-slate-400'>one-time payment</span>
            </div>

            <div className='rounded-[16px] bg-white/[0.05] p-4'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-sm text-slate-400'>You will receive</p>
                  <p className='mt-1 text-lg font-semibold text-white'>
                    {coinPackage.totalCoins.toLocaleString()} coins
                  </p>
                </div>
                <div className='text-right text-sm text-slate-400'>
                  <p>{coinPackage.coinAmount.toLocaleString()} base coins</p>
                  {coinPackage.bonusCoins > 0 && (
                    <p className='text-amber-300'>+{coinPackage.bonusCoins.toLocaleString()} bonus coins</p>
                  )}
                </div>
              </div>
            </div>

            <ul className='mt-6 space-y-3'>
              <li className='flex items-center gap-2.5 text-sm text-slate-300'>
                <Check className='h-4 w-4 shrink-0 text-green-500' />
                <span>{coinPackage.coinAmount.toLocaleString()} base coins</span>
              </li>
              {coinPackage.bonusCoins > 0 && (
                <li className='flex items-center gap-2.5 text-sm text-slate-300'>
                  <Check className='h-4 w-4 shrink-0 text-amber-500' />
                  <span>{coinPackage.bonusCoins.toLocaleString()} bonus coins</span>
                </li>
              )}
              <li className='flex items-center gap-2.5 text-sm text-slate-300'>
                <Check className='h-4 w-4 shrink-0 text-blue-500' />
                <span>Instant delivery after payment confirmation</span>
              </li>
              <li className='flex items-center gap-2.5 text-sm text-slate-300'>
                <Check className='h-4 w-4 shrink-0 text-purple-500' />
                <span>{formatBytes(coinPackage.totalCoins * 8)} estimated usage coverage</span>
              </li>
            </ul>

            <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-400'>
              <span>Package ID</span>
              <span className='font-mono text-slate-300'>{coinPackage.id}</span>
            </div>
          </section>

          <section className='rounded-[24px] bg-white/[0.035] p-6 sm:p-8'>
            {hasCurrentSubscription ? (
              <div className='space-y-4'>
                <div className='rounded-[16px] bg-emerald-500/10 p-4'>
                  <p className='font-medium text-white'>Confirm with saved payment method</p>
                  <p className='mt-1 text-sm text-emerald-100/80'>
                    Your current subscription already has a default card. Confirming will charge that card and resolve
                    the coin purchase.
                  </p>
                </div>

                <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
                  <div className='flex items-center justify-between py-1'>
                    <span>Payment method</span>
                    <span className='font-medium text-white'>Saved default card</span>
                  </div>
                  <div className='flex items-center justify-between py-1'>
                    <span>Charge amount</span>
                    <span className='font-medium text-white'>{formatPrice(coinPackage.price)}</span>
                  </div>
                  <div className='flex items-center justify-between py-1'>
                    <span>Coins</span>
                    <span className='font-medium text-white'>{coinPackage.totalCoins.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <div className='rounded-[16px] bg-red-500/10 p-4 text-sm text-red-300'>
                    {error}
                  </div>
                )}

                <div className='flex gap-3'>
                  <Button
                    onClick={handleDefaultCardConfirm}
                    disabled={isDefaultCardSubmitting || isResolving}
                    className='flex-1 rounded-[14px] bg-white text-black hover:bg-white/90'
                  >
                    {isDefaultCardSubmitting || isResolving ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleCancel}
                    className='flex-1 rounded-[14px] border-none bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='rounded-[16px] bg-blue-500/10 p-4'>
                  <p className='font-medium text-white'>Pay with Stripe</p>
                  <p className='mt-1 text-sm text-blue-100/80'>
                    Enter your card details to complete the one-time purchase. After payment succeeds, the checkout will
                    be resolved and coins will be credited.
                  </p>
                </div>

                {checkoutData?.clientSecret ? (
                  <StripeProvider clientSecret={checkoutData.clientSecret}>
                    <PaymentForm
                      amount={coinPackage.price}
                      currency={coinPackage.currency}
                      changeType='new_purchase'
                      effectiveDate={new Date().toISOString()}
                      planId={coinPackage.id}
                      planName={coinPackage.name}
                      paymentIntentId={checkoutData.paymentIntentId}
                      renew={false}
                      stripeSubscriptionId={null}
                      transactionId={checkoutData.transactionId}
                      onSuccess={() => {
                        void handleStripePaymentSuccess();
                      }}
                      onCancel={handleCancel}
                      lightMode={false}
                    />
                  </StripeProvider>
                ) : (
                  <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
                    Waiting for Stripe checkout session...
                  </div>
                )}

                {error && (
                  <div className='rounded-[16px] bg-red-500/10 p-4 text-sm text-red-300'>
                    {error}
                  </div>
                )}

                {resolveData && (
                  <div className='rounded-[16px] bg-emerald-500/10 p-4 text-sm text-emerald-100'>
                    Coins were already resolved. Redirecting to result page...
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
