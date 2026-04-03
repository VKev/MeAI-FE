import type { SubscriptionListResponse } from '@/models/subscription.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchSubscriptionsClient() {
  return clientFetch<SubscriptionListResponse>(
    '/api/User/subscriptions',
    {
      method: 'GET'
    },
    { auth: false }
  );
}
