import { clientFetch } from '@/services/client/api.client';

export type CoinPricingEntry = {
  id: string;
  actionType: string;
  model: string;
  variant: string | null;
  unit: string;
  unitCostCoins: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type CoinPricingListResponse = {
  value: CoinPricingEntry[];
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type CoinCostQuote = {
  actionType: string;
  model: string;
  variant: string | null;
  unit: string;
  unitCostCoins: number;
  quantity: number;
  totalCoins: number;
};

export type CoinCostQuoteResponse = {
  value: CoinCostQuote;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export async function fetchCoinPricing(signal?: AbortSignal) {
  return clientFetch<CoinPricingListResponse>(
    '/api/Ai/coin-pricing',
    { method: 'GET', signal },
    { auth: true }
  );
}

export async function estimateCoinCost(
  body: { actionType: string; model: string; variant?: string | null; quantity: number },
  signal?: AbortSignal
) {
  return clientFetch<CoinCostQuoteResponse>(
    '/api/Ai/coin-pricing/estimate',
    {
      method: 'POST',
      data: {
        actionType: body.actionType,
        model: body.model,
        variant: body.variant ?? null,
        quantity: body.quantity
      },
      signal
    },
    { auth: true }
  );
}
