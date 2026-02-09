import type { SubscriptionListResponse } from '@/models/subscription.model';
import axios from 'axios';
import envConfig from '@/config';

const API_URL = envConfig.VITE_API_URL;

/**
 * Fetch subscriptions - public endpoint that does not need auth cookies.
 */
export async function fetchSubscriptions(request: Request) {
  const res = await axios.get<SubscriptionListResponse>(`${API_URL}/api/User/subscriptions`, {
    signal: request.signal
  });
  return res.data;
}
