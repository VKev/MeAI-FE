import type { SocialMediaResponse } from '@/models/social-media.model';
import { clientFetch } from '@/services/client/api.client';

export interface FacebookAuthResponse {
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

export interface FacebookCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export async function getFacebookAuthUrl(scopes?: string, redirectUrl?: string) {
  const searchParams = new URLSearchParams();
  if (scopes) searchParams.set('scopes', scopes);
  if (redirectUrl) searchParams.set('redirectUrl', redirectUrl);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return clientFetch<FacebookAuthResponse>(`/api/User/facebook/authorize${query}`, {
    method: 'GET'
  }, { auth: true });
}

export async function handleFacebookCallback(params: FacebookCallbackParams) {
  const searchParams = new URLSearchParams();
  if (params.code) searchParams.set('code', params.code);
  if (params.state) searchParams.set('state', params.state);
  if (params.error) searchParams.set('error', params.error);
  if (params.error_description) searchParams.set('error_description', params.error_description);
  
  return clientFetch<SocialMediaResponse>(`/api/User/facebook/callback?${searchParams.toString()}`, {
    method: 'GET'
  }, { auth: true });
}

export async function refreshFacebookToken(socialMediaId: string) {
  return clientFetch<SocialMediaResponse>(`/api/User/facebook/${socialMediaId}/refresh`, {
    method: 'POST'
  }, { auth: true });
}
