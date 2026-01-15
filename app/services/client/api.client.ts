import axios, { type AxiosRequestConfig } from "axios";
import envConfig from "@/config";

const API_URL = envConfig.VITE_API_URL;
export const SESSION_FLAG_KEY = "hasSession";

export const markHasSession = (on: boolean) => {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(SESSION_FLAG_KEY, "true");
  else localStorage.removeItem(SESSION_FLAG_KEY);
};

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

// Singleton instances
let publicClient: ReturnType<typeof axios.create> | null = null;
let dataClient: ReturnType<typeof axios.create> | null = null;

function getPublicClient() {
  if (!publicClient) {
    publicClient = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
  }
  return publicClient;
}

function getDataClient() {
  if (!dataClient) {
    dataClient = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    // Response interceptor for auto-refresh on 401
    dataClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as any;

        // Not 401 or already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Wait for refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return dataClient!(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call FE server refresh endpoint
          const res = await fetch("/api/User/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) {
            processQueue(new Error("Refresh failed"));
            isRefreshing = false;
            markHasSession(false);
            window.location.href = "/auth/sign-in";
            return Promise.reject(error);
          }

          markHasSession(true);
          processQueue(null);
          isRefreshing = false;
          return dataClient!(originalRequest);
        } catch (err) {
          processQueue(err);
          isRefreshing = false;
          markHasSession(false);
          window.location.href = "/auth/sign-in";
          return Promise.reject(err);
        }
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
  const response = await client.request<T>({ url, ...config });
  return response.data;
}