import envConfig from '@/config';
import axios, { type AxiosRequestConfig } from 'axios';

const API_URL = envConfig.VITE_API_URL;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

async function forceLogout() {
  if (typeof window === 'undefined') return;

  await fetch('/server/api/logout', {
    method: 'POST',
    credentials: 'include'
  });

  if (window.location.pathname.startsWith('/auth')) return;
  window.location.replace('/auth/sign-in');
}

// Singleton instances
let publicClient: ReturnType<typeof axios.create> | null = null;
let dataClient: ReturnType<typeof axios.create> | null = null;

function getObjectValue(source: unknown, key: string) {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}

export function getApiErrorMessage(source: unknown, fallback: string) {
  const detail = getObjectValue(source, 'detail');
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  const message = getObjectValue(source, 'message');
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const error = getObjectValue(source, 'error');
  const description = getObjectValue(error, 'description');
  if (typeof description === 'string' && description.trim()) {
    return description;
  }

  const title = getObjectValue(source, 'title');
  if (typeof title === 'string' && title.trim()) {
    return title;
  }

  return fallback;
}

export function isRequestCanceled(error: unknown) {
  if (axios.isCancel(error)) {
    return true;
  }

  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
    return true;
  }

  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  return error instanceof Error && error.name === 'AbortError';
}

function getPublicClient() {
  if (!publicClient) {
    publicClient = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return publicClient;
}

function getDataClient() {
  if (!dataClient) {
    dataClient = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });

    // Response interceptor for auto-refresh on 401
    dataClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as any;

        // Not 401 or already retried
        if (!error.response) {
          return Promise.reject(error);
        }

        const status = error.response.status;
        const url = originalRequest?.url ?? '';

        // Không xử lý nếu không phải 401
        if (status !== 401) {
          return Promise.reject(error);
        }

        // Không refresh cho refresh endpoint
        if (url.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        // Nếu đã retry rồi thì reject`
        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: () => resolve(dataClient!(originalRequest)),
              reject
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const res = await fetch('/server/api/User/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });

        if (!res.ok) {
          processQueue(new Error('refresh failed'));
          isRefreshing = false;
          await forceLogout();
        }

        processQueue();
        isRefreshing = false;

        return dataClient!(originalRequest);
      }
    );
  }
  return dataClient;
}

/**
 * Single entrypoint.
 * - auth = false (default): public client (no refresh logic)
 * - auth = true: protected client with auto-refresh on 401
 */
export async function clientFetch<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  opts?: { auth?: boolean }
): Promise<T> {
  const useAuth = opts?.auth ?? false;
  const client = useAuth ? getDataClient() : getPublicClient();

  try {
    const response = await client.request<T>({ url, ...config });
    return response.data;
  } catch (error) {
    if (isRequestCanceled(error)) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      throw new Error(getApiErrorMessage(error.response?.data, error.message || 'Request failed'));
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Request failed');
  }
}
