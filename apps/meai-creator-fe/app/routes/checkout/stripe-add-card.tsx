import { useEffect, useRef, useState } from 'react';
import { Loader2, ArrowLeft, CreditCard, CheckCircle2 } from 'lucide-react';
import { redirect, type LoaderFunctionArgs, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { StripeProvider } from '@/components/stripe';
import SetupPaymentMethodForm from '@/components/user/SetupPaymentMethodForm';
import { getUser } from '@/services/server/session.server';
import { createPaymentCardClient } from '@/services/client/user-card.client';

type SetupIntentState = {
  setupIntentId: string;
  clientSecret: string;
  stripeCustomerId: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/auth/sign-in?redirectTo=/stripe/add-card');
  }

  return null;
}

export function shouldRevalidate() {
  return false;
}

export default function StripeAddCard() {
  const navigate = useNavigate();
  const hasInitialized = useRef(false);
  const [setupIntentData, setSetupIntentData] = useState<SetupIntentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    void (async () => {
      try {
        setIsLoading(true);
        const response = await createPaymentCardClient();

        if (response.isSuccess && response.value) {
          setSetupIntentData(response.value);
          setError(null);
        } else {
          setError(response.error.description || 'Failed to prepare card setup.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare card setup.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSuccess = () => {
    navigate('/user/card');
  };

  const handleCancel = () => {
    navigate('/user/card');
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden'>
      <div className='absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl' />
      <div className='absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl' />

      <div className='relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-6 flex items-center justify-between gap-4 rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,13,26,0.92)_0%,rgba(8,10,18,0.95)_100%)] px-5 py-5 shadow-[0_20px_60px_rgba(3,5,12,0.45)]'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]'>
              <CreditCard className='h-7 w-7' />
            </div>
            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>Add New Card</h1>
              <p className='text-sm leading-relaxed text-slate-400'>Securely add a new payment method using Stripe.</p>
            </div>
          </div>

          <Button
            variant='outline'
            size='lg'
            onClick={handleCancel}
            className='rounded-2xl border border-white/10 bg-white/4 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:bg-white/8 hover:text-white'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        </div>

        {isLoading && (
          <div className='flex flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,13,26,0.4)_0%,rgba(8,10,18,0.6)_100%)] p-10'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20'>
                <Loader2 className='h-8 w-8 animate-spin text-violet-300' />
              </div>
              <p className='text-slate-400'>Preparing Stripe checkout...</p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className='rounded-[28px] border border-red-500/20 bg-[linear-gradient(160deg,rgba(10,13,26,0.4)_0%,rgba(8,10,18,0.6)_100%)] p-6'>
            <div className='rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400'>{error}</div>
            <div className='mt-6 flex justify-center'>
              <Button
                onClick={() => window.location.reload()}
                className='rounded-2xl bg-violet-600 text-white hover:bg-violet-700'
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && setupIntentData && !error && (
          <div className='rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,13,26,0.4)_0%,rgba(8,10,18,0.6)_100%)] p-5 shadow-[0_20px_60px_rgba(3,5,12,0.45)] sm:p-7'>
            <div className='mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-emerald-400' />
                <div>
                  <p className='font-medium text-emerald-100'>Stripe is ready</p>
                  <p className='mt-1 text-sm text-emerald-100/75'>
                    Enter your card information below to save it to your account.
                  </p>
                </div>
              </div>
            </div>

            <StripeProvider clientSecret={setupIntentData.clientSecret}>
              <SetupPaymentMethodForm
                setupIntentId={setupIntentData.setupIntentId}
                stripeCustomerId={setupIntentData.stripeCustomerId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </StripeProvider>
          </div>
        )}
      </div>
    </div>
  );
}
