import { clientFetch } from '@/services/client/api.client';
import type {
  PaymentCardsListResponse,
  SetupIntentResponse,
  SetDefaultCardResponse,
  DeleteCardResponse
} from '@/models/user-card.model';

/**
 * Fetch the list of payment cards for the user
 */
export function fetchPaymentCardsClient() {
  return clientFetch<PaymentCardsListResponse>('/api/User/billing/cards', {
    method: 'GET'
  }, { auth: true });
}

/**
 * Create a new payment card using Stripe
 */
export function createPaymentCardClient() {
  return clientFetch<SetupIntentResponse>('/api/User/billing/cards', {
    method: 'POST'
  }, { auth: true });
}

/**
 * Set a card as the default payment method
 */
export function setDefaultPaymentCardClient(paymentMethodId: string) {
  return clientFetch<SetDefaultCardResponse>(
    `/api/User/billing/cards/${paymentMethodId}/default`,
    {
      method: 'POST'
    },
    { auth: true }
  );
}

/**
 * Delete a payment card
 */
export function deletePaymentCardClient(paymentMethodId: string) {
  return clientFetch<DeleteCardResponse>(
    `/api/User/billing/cards/${paymentMethodId}`,
    {
      method: 'DELETE'
    },
    { auth: true }
  );
}
