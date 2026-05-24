
import type { AiUsageHistoryParams, AiUsageHistoryResponse, AiUsageSummaryResponse } from '@/models/ai-usage.model';
import { clientFetch } from './api.client';

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAiUsageHistory(params?: AiUsageHistoryParams) {
  const queryString = buildQueryString(params as Record<string, unknown>);

  return clientFetch<AiUsageHistoryResponse>(
    `/api/Ai/usage/history${queryString}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function fetchAiUsageSummary(params?: { period?: string; fromUtc?: string; toUtc?: string }) {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return clientFetch<AiUsageSummaryResponse>(
    `/api/Ai/usage/summary${queryString}`,
    { method: 'GET' },
    { auth: true }
  );
}
