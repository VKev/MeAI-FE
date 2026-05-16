import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import envConfig from '@/config';
import type { ReactNode } from 'react';

const stripePromise = loadStripe(envConfig.VITE_STRIPE_PUBLISHABLE_KEY, {
  developerTools: {
    assistant: {
      enabled: false
    }
  }
});

interface StripeProviderProps {
  clientSecret: string;
  children: ReactNode;
}

export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#1a1a1a',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px'
      },
      rules: {
        '.Input': {
          backgroundColor: '#262626',
          border: '1px solid #404040'
        },
        '.Input:focus': {
          border: '1px solid #8b5cf6',
          boxShadow: '0 0 0 1px #8b5cf6'
        },
        '.Label': {
          color: '#a1a1aa'
        }
      }
    }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

export { stripePromise };
