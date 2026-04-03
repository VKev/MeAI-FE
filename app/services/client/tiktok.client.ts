import type { SocialMediaResponse } from '@/models/social-media.model';
import { clientFetch } from '@/services/client/api.client';

export interface TikTokAuthResponse {
  value: {
    authorizationUrl: string;
    state: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  } | null;
}

export interface TikTokCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface TikTokPublishResponse {
  value: {
    publishId: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  } | null;
}

export interface TikTokPublishStatusResponse {
  value: {
    status: string;
    videoId?: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  } | null;
}

export async function getTikTokAuthUrl(scopes?: string) {
  const params = scopes ? `?scopes=${encodeURIComponent(scopes)}` : '';
  return clientFetch<TikTokAuthResponse>(
    `/api/User/tiktok/authorize${params}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function handleTikTokCallback(params: TikTokCallbackParams) {
  const searchParams = new URLSearchParams();
  if (params.code) searchParams.set('code', params.code);
  if (params.state) searchParams.set('state', params.state);
  if (params.error) searchParams.set('error', params.error);
  if (params.error_description) searchParams.set('error_description', params.error_description);

  return clientFetch<SocialMediaResponse>(
    `/api/User/tiktok/callback?${searchParams.toString()}`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}

export async function refreshTikTokToken(socialMediaId: string) {
  return clientFetch<SocialMediaResponse>(
    `/api/User/tiktok/${socialMediaId}/refresh`,
    {
      method: 'POST'
    },
    { auth: true }
  );
}

export async function publishToTikTok(socialMediaId: string, data: { videoUrl: string; caption?: string }) {
  return clientFetch<TikTokPublishResponse>(
    `/api/User/tiktok/${socialMediaId}/publish`,
    {
      method: 'POST',
      data
    },
    { auth: true }
  );
}

export async function getTikTokPublishStatus(socialMediaId: string, publishId: string) {
  return clientFetch<TikTokPublishStatusResponse>(
    `/api/User/tiktok/${socialMediaId}/publish/${publishId}/status`,
    {
      method: 'GET'
    },
    { auth: true }
  );
}
