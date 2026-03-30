import axios from 'axios';
import { redirect } from 'react-router';
import envConfig from '@/config';
import type {
  StripeConfirmPurchaseRequest,
  StripeConfirmPurchaseResponse,
  StripePurchaseResponse
} from '@/models/stripe.model';

const API_URL = envConfig.VITE_API_URL;

export async function createStripePurchase(
  request: Request,
  subscriptionId: string
): Promise<StripePurchaseResponse> {
  const cookie = request.headers.get('cookie');

  if (!cookie) {
    throw redirect(`/auth/sign-in?redirectTo=/checkout/${subscriptionId}`);
  }

  try {
    const response = await axios.post<StripePurchaseResponse>(
      `${API_URL}/api/User/subscriptions/${subscriptionId}/purchase`,
      {
        paymentMethodId: null,
        renew: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          cookie
        },
        signal: request.signal,
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(readApiErrorMessage(error, 'Failed to create payment.'));
  }
}

export async function confirmStripePurchase(
  request: Request,
  subscriptionId: string,
  payload: StripeConfirmPurchaseRequest
): Promise<StripeConfirmPurchaseResponse> {
  const cookie = request.headers.get('cookie');

  if (!cookie) {
    throw redirect(`/auth/sign-in?redirectTo=/checkout/${subscriptionId}`);
  }

  try {
    const response = await axios.post<StripeConfirmPurchaseResponse>(
      `${API_URL}/api/User/subscriptions/${subscriptionId}/purchase/confirm`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          cookie
        },
        signal: request.signal,
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(readApiErrorMessage(error, 'Failed to confirm payment.'));
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
