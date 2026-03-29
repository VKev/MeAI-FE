import type { CurrentUserSubscriptionResponse, SubscriptionListResponse } from '@/models/subscription.model';
import axios from 'axios';
import envConfig from '@/config';
import { redirect } from 'react-router';

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

export async function fetchCurrentSubscription(request: Request) {
  const cookie = request.headers.get('cookie');

  if (!cookie) {
    throw redirect('/auth/sign-in');
  }

  try {
    const res = await axios.get<CurrentUserSubscriptionResponse>(`${API_URL}/api/User/subscriptions/current`, {
      headers: {
        cookie
      },
      signal: request.signal,
      withCredentials: true
    });

    return res.data;
  } catch (error) {
    throw new Error(readApiErrorMessage(error, 'Failed to load your current subscription.'));
  }
}

function readApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data as
    | { detail?: string; message?: string; error?: { description?: string } }
    | undefined;

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error?.description === 'string' && data.error.description.trim()) {
    return data.error.description;
  }

  return error.message || fallback;
}
