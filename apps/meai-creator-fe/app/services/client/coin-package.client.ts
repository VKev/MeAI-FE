import type {
  CoinPackageListResponse,
  CoinPackageCheckoutResponse,
  CoinPackageResolveCheckoutRequest,
  CoinPackageResolveCheckoutResponse
} from '@/models/coin-package.model';
import { clientFetch } from '@/services/client/api.client';

export async function fetchCoinPackagesClient(signal?: AbortSignal) {
  return clientFetch<CoinPackageListResponse>(
    '/api/User/billing/coin-packages',
    { method: 'GET', signal },
    { auth: true }
  );
}

export async function checkoutCoinPackageClient(
  packageId: string,
  options?: {
    useDefaultCard?: boolean;
    signal?: AbortSignal;
  }
) {
  const searchParams = new URLSearchParams();

  if (options?.useDefaultCard) {
    searchParams.set('useDefaultCard', 'true');
  }

  const queryString = searchParams.toString();

  return clientFetch<CoinPackageCheckoutResponse>(
    `/api/User/billing/coin-packages/${packageId}/checkout${queryString ? `?${queryString}` : ''}`,
    { method: 'POST', signal: options?.signal },
    { auth: true }
  );
}

export async function resolveCoinPackageCheckoutClient(
  request: CoinPackageResolveCheckoutRequest,
  signal?: AbortSignal
) {
  return clientFetch<CoinPackageResolveCheckoutResponse>(
    '/api/User/billing/coin-packages/resolve-checkout',
    {
      method: 'POST',
      data: request,
      signal
    },
    { auth: true }
  );
}