import type {
  CurrentUserSubscriptionResponse,
  SubscriptionListResponse,
  UserSubscriptionsResponse
} from '@/models/subscription.model';
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

export async function fetchCurrentSubscriptionClient() {
  return clientFetch<CurrentUserSubscriptionResponse>('/api/User/subscriptions/current', {
    method: 'GET'
  });
}

export async function fetchMySubscriptionsClient() {
  return clientFetch<UserSubscriptionsResponse>('/api/User/subscriptions/mine', {
    method: 'GET'
  });
}

export async function autoRenewMySubscriptionsClient(data: { enabled: boolean }) {
  return clientFetch<UserSubscriptionsResponse>(
    '/api/User/subscriptions/current/auto-renew',
    {
      method: 'POST',
      data
    },
    { auth: true }
  );
}


