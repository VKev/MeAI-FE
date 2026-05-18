import { clientFetch } from '@/services/client/api.client';

export type AiConfigResponse = {
  value: {
    id: string;
    chatModel: string | null;
    mediaAspectRatio: string | null;
    numberOfVariances: number | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; description: string };
};

export async function fetchAiConfig() {
  return clientFetch<AiConfigResponse>(
    '/api/User/config',
    { method: 'GET' },
    { auth: true }
  );
}
