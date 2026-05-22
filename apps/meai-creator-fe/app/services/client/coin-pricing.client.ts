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

export type CoinPricingConfigActionType = 'image_generation' | 'video_generation';

export type CoinCostQuote = {
  operation?: string;
  actionType: string;
  model: string;
  variant: string | null;
  unit: string;
  unitCostCoins: number;
  quantity: number;
  totalCoins: number;
  currentBalance?: number;
  canAfford?: boolean;
  shortfallCoins?: number;
};

export type CoinCostQuoteResponse = {
  value: CoinCostQuote;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string } | null;
};

export type CoinPricingConfigEstimateInput = {
  actionType: CoinPricingConfigActionType;
  model: string;
  variant?: string | null;
  quantity: number;
};

export type CoinPricingReferenceEstimateInput = {
  actionType: 'image_reframe_variant';
  model: string;
  variant?: string | null;
  quantity: number;
  resourceIds: string[];
};

export type CoinPricingModalEstimateInput = {
  operation: string;
  referenceImageCount?: number;
};

export async function fetchCoinPricing(signal?: AbortSignal) {
  return clientFetch<CoinPricingListResponse>(
    '/api/Ai/coin-pricing',
    { method: 'GET', signal },
    { auth: true }
  );
}

export async function estimateCoinCost(
  body: CoinPricingConfigEstimateInput,
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

export async function estimateCoinCostByReferenceImages(
  body: CoinPricingReferenceEstimateInput,
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
        quantity: body.quantity,
        resourceIds: body.resourceIds
      },
      signal
    },
    { auth: true }
  );
}

export async function estimateAiGenerationCost(body: CoinPricingModalEstimateInput, signal?: AbortSignal) {
  return clientFetch<CoinCostQuoteResponse>(
    '/api/AiGeneration/estimate',
    {
      method: 'POST',
      data: {
        operation: body.operation,
        referenceImageCount: body.referenceImageCount ?? null
      },
      signal
    },
    { auth: true }
  );
}
