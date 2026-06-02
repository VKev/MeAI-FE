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
    <div className='min-h-screen bg-[#050609]'>
      <div className='mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8'>
        <header className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
              <CreditCard className='h-5 w-5' />
            </div>
            <div className='space-y-0.5'>
              <h1 className='text-xl font-bold tracking-tight text-white'>Add New Card</h1>
              <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
                Securely add a new payment method using Stripe
              </p>
            </div>
          </div>

          <Button
            variant='outline'
            size='lg'
            onClick={handleCancel}
            className='h-10 rounded-[14px] border-none bg-white/[0.05] px-4 text-xs font-bold text-slate-200 hover:bg-white/[0.08] hover:text-white'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        </header>

        {isLoading && (
          <div className='flex flex-1 items-center justify-center rounded-[24px] bg-white/[0.035] p-10'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20'>
                <Loader2 className='h-8 w-8 animate-spin text-violet-300' />
              </div>
              <p className='text-slate-400'>Preparing Stripe checkout...</p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className='rounded-[24px] bg-red-500/10 p-6'>
            <div className='rounded-[16px] bg-red-500/10 p-4 text-red-400'>{error}</div>
            <div className='mt-6 flex justify-center'>
              <Button
                onClick={() => window.location.reload()}
                className='rounded-[14px] bg-white text-black hover:bg-white/90'
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && setupIntentData && !error && (
          <div className='rounded-[24px] bg-white/[0.035] p-5 sm:p-7'>
            <div className='mb-6 rounded-[16px] bg-emerald-500/10 p-4'>
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
