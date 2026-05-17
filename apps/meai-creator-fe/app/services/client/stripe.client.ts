import { clientFetch } from '@/services/client/api.client';
import type { StripeConfirmPurchaseRequest, StripeConfirmPurchaseResponse, StripePurchaseResponse } from '@/models/stripe.model';

export function confirmStripePurchaseClient(subscriptionId: string, payload: StripeConfirmPurchaseRequest) {
  return clientFetch<StripeConfirmPurchaseResponse>(
    `/api/User/subscriptions/${subscriptionId}/purchase/confirm`,
    {
      method: 'POST',
      data: payload
    },
    { auth: true }
  );
}

export function createStripePurchaseClient(subscriptionId: string) {
  return clientFetch<StripePurchaseResponse>(
    `/api/User/subscriptions/${subscriptionId}/purchase`,
    {
      method: 'POST',
      data: {
        paymentMethodId: null,
        renew: true
      }
    },
    { auth: true }
  );
}
