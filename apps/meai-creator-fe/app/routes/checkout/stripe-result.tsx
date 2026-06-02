import { useEffect, useState, useCallback, useRef } from 'react';
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmStripePurchaseClient } from '@/services/client/stripe.client';
import { toast } from 'sonner';
import { useRefetchUser } from '@/utils/user-state';

type LoaderData = {
  planId: string;
  error: string | null;
  metadata: {
    paymentIntentId: string | null;
    stripeSubscriptionId: string | null;
    transactionId: string | null;
    renew: boolean;
  };
};

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const planId = url.searchParams.get('planId')?.trim() ?? '';
  const paymentIntentId = url.searchParams.get('payment_intent')?.trim() ?? null;
  const stripeSubscriptionId = url.searchParams.get('stripeSubscriptionId')?.trim() ?? null;
  const transactionId = url.searchParams.get('transactionId')?.trim() ?? null;
  const renew = url.searchParams.get('renew') !== 'false'; // Default to true if not specified
  const redirectStatus = url.searchParams.get('redirect_status')?.trim() ?? null;

  const metadata = { paymentIntentId, stripeSubscriptionId, transactionId, renew };

  if (!planId) {
    return {
      planId: '',
      error: 'Subscription plan is missing from the Stripe return URL.',
      metadata
    };
  }

  if (redirectStatus === 'failed') {
    return {
      planId,
      error: 'Stripe reported that the payment was not completed.',
      metadata
    };
  }

  return {
    planId,
    error: null,
    metadata
  };
}

export function shouldRevalidate() {
  return false;
}

export default function StripeResult() {
  const navigate = useNavigate();
  const refetchUser = useRefetchUser();
  const { planId, error: initialError, metadata } = useLoaderData<typeof loader>();

  const [isActivated, setIsActivated] = useState(false);
  const [isPolling, setIsPolling] = useState(!initialError);
  const [error, setError] = useState(initialError);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxAttempts = 15; // 30 seconds total (15 * 2s)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(async () => {
    if (pollingAttempts >= maxAttempts) {
      setIsPolling(false);
      setError(
        'Payment verification timed out. Please check your billing history in a few minutes or contact support.'
      );
      return;
    }

    try {
      const response = await confirmStripePurchaseClient(planId, metadata);

      if (response.isSuccess && response.value.subscriptionActivated) {
        setIsActivated(true);
        setIsPolling(false);
        setError(null);
        void refetchUser();
        toast.success('Payment confirmed successfully!');
      } else {
        // Continue polling
        setPollingAttempts((prev) => prev + 1);
        pollTimerRef.current = setTimeout(startPolling, 2000);
      }
    } catch (err) {
      console.error('Polling error:', err);
      // Wait longer on error but keep polling
      setPollingAttempts((prev) => prev + 1);
      pollTimerRef.current = setTimeout(startPolling, 3000);
    }
  }, [planId, metadata, pollingAttempts]);

  useEffect(() => {
    if (isPolling) {
      pollTimerRef.current = setTimeout(startPolling, 1000);
    }

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isPolling, startPolling]);

  useEffect(() => {
    if (isActivated) {
      void refetchUser();
      const timeoutId = window.setTimeout(() => {
        navigate('/user/dashboard');
      }, 2000);
      return () => window.clearTimeout(timeoutId);
    }
  }, [navigate, isActivated, refetchUser]);

  // Success View
  if (isActivated) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='w-full max-w-md rounded-[24px] bg-white/[0.035] p-8 text-center animate-in fade-in zoom-in duration-500'>
          <div className='w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 relative'>
            <div className='absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-25' />
            <CheckCircle className='w-10 h-10 text-emerald-500 relative z-10' />
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>Payment Successful!</h1>
          <p className='text-emerald-400/80 font-medium mb-1'>Welcome to MeAI Premium</p>
          <p className='text-slate-400 mb-8'>
            Your subscription has been activated. We're taking you to your dashboard now...
          </p>
          <Button
            onClick={() => navigate('/user/dashboard')}
            className='w-full rounded-[14px] bg-white py-6 font-semibold text-black hover:bg-white/90'
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Polifying/Verifying View
  if (isPolling) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
        <div className='w-full max-w-md rounded-[24px] bg-white/[0.035] p-8 text-center'>
          <div className='w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-6 relative'>
            <Loader2 className='w-10 h-10 text-violet-500 animate-spin' />
            <div className='absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-[spin_3s_linear_infinite]' />
          </div>
          <h1 className='text-2xl font-semibold text-white mb-2'>Verifying Payment</h1>
          <p className='text-slate-400 mb-6 px-4'>
            We are confirming your transaction with Stripe. This usually takes just a few seconds.
          </p>
          <div className='space-y-4'>
            <div className='h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden'>
              <div
                className='h-full bg-linear-to-r from-violet-600 to-purple-600 transition-all duration-500 ease-out'
                style={{ width: `${(pollingAttempts / maxAttempts) * 100}%` }}
              />
            </div>
            <p className='text-[10px] text-slate-500 uppercase tracking-widest font-bold'>
              Status: Synchronizing with Gateway...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error/Failure View
  return (
    <div className='flex min-h-screen items-center justify-center bg-[#050609] px-4'>
      <div className='w-full max-w-md rounded-[24px] bg-white/[0.035] p-8 text-center'>
        <div className='w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6'>
          <XCircle className='w-10 h-10 text-red-500' />
        </div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Action Required</h1>
        <p className='text-slate-400 mb-8'>{error || 'We could not verify your payment at this time.'}</p>

        <div className='flex flex-col gap-3'>
          <Button
            onClick={() => {
              setPollingAttempts(0);
              setError(null);
              setIsPolling(true);
            }}
            className='w-full rounded-[14px] border-none bg-white/[0.05] py-6 text-white hover:bg-white/[0.08]'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Try Verifying Again
          </Button>

          <Button
            onClick={() => navigate(`/checkout/${planId}`)}
            className='w-full rounded-[14px] bg-white py-6 text-black hover:bg-white/90'
          >
            Return to Checkout
          </Button>

          <Button
            variant='outline'
            onClick={() => navigate('/user/transaction')}
            className='w-full border-neutral-700 text-slate-400 hover:text-white hover:bg-neutral-800 py-6 rounded-xl'
          >
            Open Billing History
          </Button>
        </div>
      </div>
    </div>
  );
}
