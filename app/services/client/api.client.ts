import axios, { type AxiosRequestConfig } from "axios";
import envConfig from "@/config";

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
  if (typeof window === "undefined") return;

  await fetch("/api/logout", {
    method: "POST",
    credentials: "include"
  });

  if (window.location.pathname.startsWith("/auth")) return;

  window.location.replace("/auth/sign-in");
}

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
        if (!error.response) {
          return Promise.reject(error);
        }

        const status = error.response.status;
        const url = originalRequest?.url ?? "";

        // Không xử lý nếu không phải 401
        if (status !== 401) {
          return Promise.reject(error);
        }

        // Không refresh cho auth-me
        if (url.includes("/auth/me")) {
          return Promise.reject(error);
        }

        // Không refresh cho refresh endpoint
        if (url.includes("/auth/refresh")) {
          return Promise.reject(error);
        }

        // Nếu đã retry rồi thì reject
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

        try {
          const res = await fetch("/api/User/auth/refresh", {
            method: "POST",
            credentials: "include"
          });

          if (!res.ok) {
            processQueue(new Error("refresh failed"));
            isRefreshing = false;
            await forceLogout();
            return Promise.reject(error);
          }

          processQueue();
          isRefreshing = false;

          return dataClient!(originalRequest);
        } catch (err) {
          processQueue(err);
          isRefreshing = false;
          await forceLogout();
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