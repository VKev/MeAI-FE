import { useEffect } from 'react';
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmStripePurchase } from '@/services/server/stripe.server';

type LoaderData = {
  planId: string;
  status: string;
  subscriptionActivated: boolean;
  error: string | null;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const planId = url.searchParams.get('planId')?.trim() ?? '';
  const paymentIntentId = url.searchParams.get('payment_intent')?.trim() ?? null;
  const stripeSubscriptionId = url.searchParams.get('stripeSubscriptionId')?.trim() ?? null;
  const transactionId = url.searchParams.get('transactionId')?.trim() ?? null;
  const renew = url.searchParams.get('renew') === 'true';
  const redirectStatus = url.searchParams.get('redirect_status')?.trim() ?? null;

  if (!planId) {
    return {
      planId: '',
      status: 'failed',
      subscriptionActivated: false,
      error: 'Subscription plan is missing from the Stripe return URL.'
    };
  }

  if (redirectStatus === 'failed') {
    return {
      planId,
      status: 'failed',
      subscriptionActivated: false,
      error: 'Stripe reported that the payment was not completed.'
    };
  }

  try {
    const confirmation = await confirmStripePurchase(request, planId, {
      paymentIntentId,
      stripeSubscriptionId,
      transactionId,
      renew
    });

    if (!confirmation.isSuccess) {
      return {
        planId,
        status: 'failed',
        subscriptionActivated: false,
        error: confirmation.error.description || 'Payment confirmation failed.'
      };
    }

    return {
      planId,
      status: confirmation.value.status,
      subscriptionActivated: confirmation.value.subscriptionActivated,
      error: confirmation.value.subscriptionActivated ? null : 'Payment is still pending confirmation.'
    };
  } catch (error) {
    return {
      planId,
      status: 'failed',
      subscriptionActivated: false,
      error: error instanceof Error ? error.message : 'Payment confirmation failed.'
    };
  }
}

export function shouldRevalidate() {
  return false;
}

export default function StripeResult() {
  const navigate = useNavigate();
  const { planId, error, subscriptionActivated } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (!subscriptionActivated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/user/dashboard');
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, subscriptionActivated]);

  if (subscriptionActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Payment Confirmed</h1>
          <p className="text-slate-400 mb-6">Your subscription is active. Redirecting to your dashboard...</p>
          <Button onClick={() => navigate('/user/dashboard')} className="bg-violet-600 hover:bg-violet-700 text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Payment Not Confirmed</h1>
        <p className="text-slate-400 mb-6">{error || 'We could not verify your Stripe payment yet.'}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(`/checkout/${planId}`)} className="bg-violet-600 hover:bg-violet-700 text-white">
            Return to Checkout
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/user/billing-history')}
            className="border-neutral-600 text-white hover:bg-neutral-800 hover:text-white"
          >
            Open Billing History
          </Button>
        </div>
      </div>
    </div>
  );
}
