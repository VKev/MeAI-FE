import { useEffect } from 'react';
import { useLocation, useNavigate, type LoaderFunctionArgs, redirect } from 'react-router';
import { CheckCircle2, Loader2, Package2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { fetchCoinPackagesClient } from '@/services/client/coin-package.client';
import { getUser } from '@/services/server/session.server';
import type { CoinPackage, CoinPackageResolveCheckoutResponse } from '@/models/coin-package.model';
import { useRefetchUser } from '@/utils/user-state';

type ResultState = {
  coinPackage?: CoinPackage;
  checkoutData?: {
    clientSecret: string;
    paymentIntentId: string;
    transactionId: string;
  };
  resolveData?: CoinPackageResolveCheckoutResponse['value'];
  usedDefaultCard?: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/auth/sign-in?redirectTo=/checkout/coin-package/result');
  }

  return null;
}

export function shouldRevalidate() {
  return false;
}

export default function CoinPackageCheckoutResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const refetchUser = useRefetchUser();

  const state = (location.state || {}) as ResultState;
  const searchParams = new URLSearchParams(location.search);
  const packageId = searchParams.get('packageId') || state.coinPackage?.id || '';
  const transactionId =
    searchParams.get('transactionId') || state.resolveData?.transactionId || state.checkoutData?.transactionId || '';
  const paymentIntentId =
    searchParams.get('paymentIntentId') ||
    state.resolveData?.paymentIntentId ||
    state.checkoutData?.paymentIntentId ||
    '';
  const creditedCoins = Number(searchParams.get('creditedCoins') || state.resolveData?.creditedCoins || 0);
  const currentBalance = Number(searchParams.get('currentBalance') || state.resolveData?.currentBalance || 0);
  const status = searchParams.get('status') || state.resolveData?.status || 'completed';
  const coinsCredited =
    (searchParams.get('coinsCredited') || String(state.resolveData?.coinsCredited ?? true)) === 'true';
  const alreadyCredited =
    (searchParams.get('alreadyCredited') || String(state.resolveData?.alreadyCredited ?? false)) === 'true';

  const { data: packagesData, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['coin-packages'],
    queryFn: () => fetchCoinPackagesClient(),
    enabled: !state.coinPackage && Boolean(packageId),
    staleTime: 5 * 60_000
  });

  const coinPackage = state.coinPackage ?? packagesData?.value?.find((item) => item.id === packageId) ?? null;

  useEffect(() => {
    void refetchUser();
  }, [refetchUser]);

  const handleBackToPlans = () => {
    navigate('/user/plans');
  };

  const handleBillingHistory = () => {
    navigate('/user/transaction');
  };

  if (isPackagesLoading && !coinPackage) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20'>
            <Loader2 className='h-8 w-8 animate-spin text-violet-300' />
          </div>
          <p className='text-slate-400'>Loading purchase result...</p>
        </div>
      </div>
    );
  }

  if (!coinPackage || !transactionId || !paymentIntentId) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='max-w-md w-full text-center'>
          <div className='rounded-[24px] bg-white/[0.035] p-8'>
            <div className='mb-6 rounded-[16px] bg-red-500/10 p-4'>
              <p className='text-red-400'>Purchase result is missing required data.</p>
            </div>
            <Button onClick={handleBackToPlans} className='rounded-[14px] bg-white text-black hover:bg-white/90'>
              Back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#050609]'>
      <div className='mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-4 py-10'>
        <div className='w-full rounded-[24px] bg-white/[0.035] p-6 sm:p-8'>
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] bg-emerald-500/10'>
            <CheckCircle2 className='h-8 w-8 text-emerald-400' />
          </div>

          <div className='text-center'>
            <h1 className='text-xl font-bold tracking-tight text-white'>Coin purchase complete</h1>
            <p className='mt-2 text-sm leading-relaxed text-slate-400'>
              {coinsCredited
                ? 'Your coins have been credited and the balance has been refreshed.'
                : 'Your payment finished successfully and the balance is being updated.'}
            </p>
          </div>

          <div className='mt-8 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
              <p className='text-slate-400'>Package</p>
              <p className='mt-1 text-base font-semibold text-white'>{coinPackage.name}</p>
            </div>
            <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
              <p className='text-slate-400'>Coins credited</p>
              <p className='mt-1 text-base font-semibold text-white'>{creditedCoins.toLocaleString()}</p>
            </div>
            <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
              <p className='text-slate-400'>Current balance</p>
              <p className='mt-1 text-base font-semibold text-white'>{currentBalance.toLocaleString()}</p>
            </div>
            <div className='rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
              <p className='text-slate-400'>Payment method</p>
              <p className='mt-1 text-base font-semibold text-white'>
                {state.usedDefaultCard ? 'Saved default card' : 'Stripe Payment Element'}
              </p>
            </div>
          </div>

          <div className='mt-4 rounded-[16px] bg-white/[0.05] p-4 text-sm text-slate-300'>
            <div className='flex items-center gap-2 text-slate-400'>
              <Package2 className='h-4 w-4' />
              <span>Transaction details</span>
            </div>
            <div className='mt-3 grid gap-3 sm:grid-cols-2'>
              <div className='flex items-center justify-between gap-3 rounded-[12px] bg-black/20 px-4 py-3'>
                <span className='text-slate-400'>Transaction ID</span>
                <span className='font-mono text-sm text-white'>{transactionId}</span>
              </div>
              <div className='flex items-center justify-between gap-3 rounded-[12px] bg-black/20 px-4 py-3'>
                <span className='text-slate-400'>Payment Intent</span>
                <span className='font-mono text-sm text-white'>{paymentIntentId}</span>
              </div>
            </div>
            <div className='mt-3 flex flex-wrap gap-2 text-xs text-slate-400'>
              <span className='rounded-[12px] bg-white/[0.05] px-3 py-1'>Status: {status}</span>
              <span className='rounded-[12px] bg-white/[0.05] px-3 py-1'>
                Coins credited: {String(coinsCredited)}
              </span>
              <span className='rounded-[12px] bg-white/[0.05] px-3 py-1'>
                Already credited: {String(alreadyCredited)}
              </span>
            </div>
          </div>

          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Button onClick={handleBackToPlans} className='flex-1 rounded-[14px] bg-white text-black hover:bg-white/90'>
              Back to Plans
            </Button>
            <Button
              variant='outline'
              onClick={handleBillingHistory}
              className='flex-1 rounded-[14px] border-none bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white'
            >
              Open Billing History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
