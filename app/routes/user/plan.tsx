import { useEffect, useState } from 'react';
import { useNavigate, useNavigation } from 'react-router';
import type { CurrentUserSubscription, Subscription } from '@/models/subscription.model';
import type { CoinPackage } from '@/models/coin-package.model';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient, fetchMySubscriptionsClient } from '@/services/client/subscription.client';
import { fetchCoinPackagesClient, checkoutCoinPackageClient } from '@/services/client/coin-package.client';
import {
  Check,
  Crown,
  Zap,
  CreditCard,
  Coins,
  Sparkles,
  Share2,
  Zap as ZapIcon,
  HardDrive,
  Upload,
  Trash2,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlanActionState } from '@/utils/subscription-flow';
import { useCurrentUser } from '@/utils/user-state';
import { toast } from 'react-toastify';

export default function Plan() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const {
    data: subsData,
    isError: fetchFailed,
    isLoading: isSubsLoading
  } = useQuery({
    queryKey: ['public-subscriptions'],
    queryFn: () => fetchSubscriptionsClient()
  });

  const { data: userSubsData, isLoading: isUserSubsLoading } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: () => fetchMySubscriptionsClient()
  });

  const {
    data: coinPackagesData,
    isLoading: isCoinPackagesLoading,
    isError: coinPackagesFetchFailed
  } = useQuery({
    queryKey: ['coin-packages'],
    queryFn: () => fetchCoinPackagesClient(),
    enabled: !!userSubsData?.value?.find((item) => item.isCurrent) // Only fetch if user has a subscription
  });

  const user = useCurrentUser();

  const subscriptions = subsData?.value ?? [];
  const userSubscriptions = userSubsData?.value ?? [];
  const coinPackages = coinPackagesData?.value ?? [];
  const error = fetchFailed ? 'Failed to load subscriptions.' : null;
  const coinPackagesError = coinPackagesFetchFailed ? 'Failed to load coin packages.' : null;
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [pendingCoinPackageId, setPendingCoinPackageId] = useState<string | null>(null);

  useEffect(() => {
    if (navigation.state === 'idle') {
      setPendingPlanId(null);
      setPendingCoinPackageId(null);
    }
  }, [navigation.state]);

  // Check for coin purchase success from navigation state
  useEffect(() => {
    const locationState = navigation.location?.state as any;
    if (locationState?.coinPurchaseSuccess) {
      toast.success(
        `🎉 ${locationState.coinsAdded.toLocaleString()} coins have been added to your account! Your new balance is ${locationState.newBalance.toLocaleString()} coins.`,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'dark'
        }
      );
    }
  }, [navigation.location?.state]);

  // Show error toast if coin packages fail to load
  useEffect(() => {
    if (coinPackagesError) {
      toast.error(coinPackagesError, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark'
      });
    }
  }, [coinPackagesError]);

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
    <div>
      {/* Header */}
      <section className='mb-10 overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
            <Crown className='h-7 w-7' />
          </div>

          <div className='space-y-1'>
            <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Subscription Plans</h1>
            <p className='text-sm leading-relaxed text-slate-400'>
              Choose the plan that best fits your needs. Upgrade or change your subscription anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Current Plan Info */}
      {user && (
        <div className='mb-8 p-5 bg-linear-to-r from-violet-500/10 to-purple-600/10 rounded-[28px] border border-violet-500/30'>
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
      {isSubsLoading || isUserSubsLoading ? (
        <div className='flex justify-center items-center py-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent'></div>
        </div>
      ) : subscriptions.length === 0 && !error ? (
        <div className='rounded-xl border border-white/10 bg-[#090912]/76 p-8 text-center'>
          <h2 className='text-xl font-semibold text-white'>No plans available right now</h2>
        </div>
      ) : !error ? (
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
      ) : null}

      {/* Coin Packages Section - Only show if user has a subscription */}
      {user && currentSubscription && (
        <div className='mt-12'>
          <section className='mb-6 overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-6 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:px-7 sm:py-8'>
            <div className='flex items-center gap-4'>
              <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
                <Coins className='h-7 w-7' />
              </div>

              <div className='space-y-1'>
                <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Buy More Coins</h1>
                <p className='text-sm leading-relaxed text-slate-400'>
                  Need more coins? Purchase additional coin packages to continue using MeAI features.
                </p>
              </div>
            </div>
          </section>

          {/* Coin Packages Loading */}
          {isCoinPackagesLoading ? (
            <div className='flex justify-center items-center py-10'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent'></div>
            </div>
          ) : coinPackages.length === 0 && !coinPackagesError ? (
            <div className='rounded-xl border border-white/10 bg-[#090912]/76 p-8 text-center'>
              <h2 className='text-xl font-semibold text-white'>No coin packages available right now</h2>
            </div>
          ) : !coinPackagesError ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {coinPackages.map((coinPackage: CoinPackage) => (
                <CoinPackageCard
                  key={coinPackage.id}
                  coinPackage={coinPackage}
                  isRedirecting={pendingCoinPackageId === coinPackage.id}
                  isInteractionLocked={pendingCoinPackageId !== null}
                  onBuyClick={setPendingCoinPackageId}
                />
              ))}
            </div>
          ) : null}
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
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const features = [
    {
      label: `${plan.limits?.number_of_social_accounts ?? 1} Social Accounts`,
      icon: <Share2 className='w-4 h-4 text-blue-500 shrink-0' />
    },
    {
      label: `${plan.limits?.number_of_workspaces ?? '0'} Workspaces`,
      icon: <Building className='w-4 h-4 text-indigo-500 shrink-0' />
    },
    // {
    //   label: `${plan.limits?.max_pages_per_social_account ?? 1} Pages per Account`,
    //   icon: <Zap className='w-4 h-4 text-orange-500 shrink-0' />
    // },
    // {
    //   label: `${plan.limits?.rate_limit_for_content_creation ?? 1} Content/Day`,
    //   icon: <ZapIcon className='w-4 h-4 text-amber-500 shrink-0' />
    // },
    {
      label: `${plan.meAiCoin} MeAI Coins`,
      icon: <Coins className='w-4 h-4 text-yellow-500 shrink-0' />
    },
    {
      label: `${formatBytes(plan.limits?.storage_quota_bytes ?? 0)} Storage`,
      icon: <HardDrive className='w-4 h-4 text-purple-500 shrink-0' />
    },
    // {
    //   label: `${formatBytes(plan.limits?.max_upload_file_bytes ?? 0)} Max File Size`,
    //   icon: <Upload className='w-4 h-4 text-green-500 shrink-0' />
    // },
    {
      label: `${plan.limits?.retention_days_after_delete ?? 30}d Data Retention`,
      icon: <Trash2 className='w-4 h-4 text-red-500 shrink-0' />
    }
  ];

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
      className={`relative rounded-[28px] p-6 transition-all duration-300 hover:scale-[1.02] ${
        isPopular
          ? 'bg-linear-to-b from-violet-600/20 to-purple-800/20 border-2 border-violet-500'
          : 'border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)]'
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
            {feature.icon}
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>

      {/* Subscribe Button */}
      <Button
        variant={'default'}
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

function CoinPackageCard({
  coinPackage,
  isRedirecting,
  isInteractionLocked,
  onBuyClick
}: {
  coinPackage: CoinPackage;
  isRedirecting: boolean;
  isInteractionLocked: boolean;
  onBuyClick: (packageId: string) => void;
}) {
  const navigate = useNavigate();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleClick = async () => {
    if (isInteractionLocked) return;

    onBuyClick(coinPackage.id);

    try {
      // Call checkout API
      const response = await checkoutCoinPackageClient(coinPackage.id);

      if (response.isSuccess && response.value) {
        // Navigate to coin package checkout page
        navigate('/checkout/coin-package', {
          state: {
            clientSecret: response.value.clientSecret,
            paymentIntentId: response.value.paymentIntentId,
            transactionId: response.value.transactionId,
            coinPackage: coinPackage
          }
        });
      } else {
        console.error('Checkout failed:', response.error);
        toast.error(response.error?.description || 'Failed to start checkout. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'dark'
        });
        // Reset pending state on error
        onBuyClick('');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred while starting checkout. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark'
      });
      // Reset pending state on error
      onBuyClick('');
    }
  };

  const buttonLabel = isRedirecting ? 'Processing...' : 'Buy Now';
  const buttonDisabled = isInteractionLocked;

  return (
    <div className='relative rounded-[28px] p-6 transition-all duration-300 hover:scale-[1.02] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)]'>
      {/* Best Value Badge for packages with bonus coins */}
      {coinPackage.bonusCoins > 0 && (
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-linear-to-r from-amber-600 to-orange-600 rounded-full text-xs font-semibold text-white flex items-center gap-1'>
          <Sparkles className='w-3 h-3' />
          Best Value
        </div>
      )}

      {/* Package Name */}
      <h3 className='text-xl font-bold text-white mb-1'>{coinPackage.name}</h3>

      {/* Coin Amount */}
      <div className='mb-4'>
        <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-white'>{coinPackage.totalCoins.toLocaleString()}</span>
          <span className='text-slate-400'>coins</span>
        </div>
        {coinPackage.bonusCoins > 0 && (
          <p className='text-sm text-amber-400 mt-1'>+{coinPackage.bonusCoins.toLocaleString()} bonus coins</p>
        )}
      </div>

      {/* Price */}
      <div className='mb-5'>
        <span className='text-2xl font-bold text-white'>{formatPrice(coinPackage.price)}</span>
        <span className='text-slate-400 ml-2'>one-time payment</span>
      </div>

      {/* Features */}
      <ul className='space-y-2.5 mb-6'>
        <li className='flex items-center gap-2.5 text-slate-300 text-sm'>
          <Check className='w-4 h-4 text-green-500 shrink-0' />
          <span>{coinPackage.coinAmount.toLocaleString()} base coins</span>
        </li>
        {coinPackage.bonusCoins > 0 && (
          <li className='flex items-center gap-2.5 text-slate-300 text-sm'>
            <Check className='w-4 h-4 text-amber-500 shrink-0' />
            <span>{coinPackage.bonusCoins.toLocaleString()} bonus coins</span>
          </li>
        )}
        <li className='flex items-center gap-2.5 text-slate-300 text-sm'>
          <Check className='w-4 h-4 text-blue-500 shrink-0' />
          <span>Instant delivery</span>
        </li>
      </ul>

      {/* Buy Button */}
      <Button
        variant={'default'}
        onClick={handleClick}
        disabled={buttonDisabled}
        className='w-full py-2.5 font-medium transition-all duration-300 bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30'
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
