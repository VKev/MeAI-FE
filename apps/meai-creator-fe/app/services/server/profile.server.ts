import type { TGetMeResponse } from '@/models/profile.model';
import envConfig from '@/config';
import axios from 'axios';
import { redirect } from 'react-router';
import { destroySession, getSession } from '@/services/server/session.server';

const API_URL = envConfig.VITE_API_URL;

type FetchAuthProfileResult = {
  profile: TGetMeResponse;
  headers: Headers;
};

export async function fetchAuthProfile(request: Request): Promise<FetchAuthProfileResult> {
  const cookie = request.headers.get('cookie');

  if (!cookie) {
    throw redirect('/auth/sign-in');
  }

  try {
    const profile = await requestProfile(cookie, request.signal);
    return { profile, headers: new Headers() };
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw new Error(readApiErrorMessage(error, 'Failed to load your profile.'));
    }
  }

  try {
    const refreshResult = await refreshAuthCookie(cookie, request.signal);
    const profile = await requestProfile(refreshResult.cookie, request.signal);

    return {
      profile,
      headers: refreshResult.headers
    };
  } catch (error) {
    if (isUnauthorizedError(error) || isInvalidRefreshTokenError(error)) {
      throw await redirectToSignin(request, getResponseSetCookie(error));
    }

    throw new Error(readApiErrorMessage(error, 'Failed to load your profile.'));
  }
}

async function requestProfile(cookie: string, signal: AbortSignal) {
  const response = await axios.get<TGetMeResponse>(`${API_URL}/api/User/auth/me`, {
    headers: {
      cookie
    },
    signal,
    withCredentials: true
  });

  return response.data;
}

async function refreshAuthCookie(cookie: string, signal: AbortSignal) {
  const response = await axios.post(`${API_URL}/api/User/auth/refresh`, null, {
    headers: {
      cookie
    },
    signal,
    withCredentials: true
  });

  const headers = new Headers();
  const responseCookies = getResponseSetCookie(response);
  responseCookies.forEach((value) => headers.append('Set-Cookie', value));

  return {
    cookie: mergeCookies(cookie, responseCookies),
    headers
  };
}

async function redirectToSignin(request: Request, backendCookies: string[] = []) {
  const session = await getSession(request);
  const headers = new Headers();

  headers.append('Set-Cookie', await destroySession(session));
  backendCookies.forEach((cookie) => headers.append('Set-Cookie', cookie));

  return redirect('/auth/sign-in', { headers });
}

function mergeCookies(initialCookie: string, setCookies: string[]) {
  const cookieMap = new Map<string, string>();

  initialCookie
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookieMap.set(key, value);
    });

  setCookies.forEach((entry) => {
    const [cookiePair] = entry.split(';', 1);
    if (!cookiePair) {
      return;
    }

    const separatorIndex = cookiePair.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    cookieMap.set(key, value);
  });

  return [...cookieMap.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

function getResponseSetCookie(source: unknown) {
  if (axios.isAxiosError(source)) {
    return normalizeSetCookie(source.response?.headers?.['set-cookie']);
  }

  if (source && typeof source === 'object' && 'headers' in source) {
    const headers = (source as { headers?: Record<string, string | string[] | undefined> }).headers;
    return normalizeSetCookie(headers?.['set-cookie']);
  }

  return [];
}

function normalizeSetCookie(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function isInvalidRefreshTokenError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const data = error.response?.data as { type?: string; message?: string } | undefined;
  return data?.type === 'Auth.InvalidRefreshToken' || data?.message === 'Invalid refresh token';
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
