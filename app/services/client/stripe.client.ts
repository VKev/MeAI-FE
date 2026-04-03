import { clientFetch } from '@/services/client/api.client';
import type { StripeConfirmPurchaseRequest, StripeConfirmPurchaseResponse } from '@/models/stripe.model';

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
