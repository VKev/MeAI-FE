import { useState, type FormEvent } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SetupPaymentMethodFormProps {
  setupIntentId: string;
  stripeCustomerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SetupPaymentMethodForm({
  setupIntentId,
  stripeCustomerId,
  onSuccess,
  onCancel
}: SetupPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe is not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Failed to validate payment method');
        setSetupStatus('error');
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/card`
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to setup payment method');
        setSetupStatus('error');
      } else {
        setSetupStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      setSetupStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (setupStatus === 'success') {
    return (
      <div className='space-y-4 text-center py-8'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-emerald-500/20 border border-emerald-500/30 p-3'>
            <CheckCircle className='h-8 w-8 text-emerald-400' />
          </div>
        </div>
        <div>
          <h3 className='text-lg font-semibold text-white mb-2'>Card Added Successfully</h3>
          <p className='text-slate-400'>Your new payment method has been added to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {errorMessage && (
        <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3'>
          <XCircle className='h-5 w-5 text-red-400 shrink-0 mt-0.5' />
          <p className='text-red-400 text-sm'>{errorMessage}</p>
        </div>
      )}

      <div className='bg-white/5 rounded-lg p-6 border border-white/10'>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
                phone: '',
                address: {
                  country: '',
                  postal_code: '',
                  state: '',
                  city: '',
                  line1: '',
                  line2: ''
                }
              }
            }
          }}
        />
      </div>

      <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isProcessing}
          className='w-full border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 sm:w-auto'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isProcessing || !stripe || !elements}
          className='w-full bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 sm:w-auto'
        >
          {isProcessing ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing...
            </>
          ) : (
            'Add Card'
          )}
        </Button>
      </div>
    </form>
  );
}
