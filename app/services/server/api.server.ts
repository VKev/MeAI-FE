import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  getSession,
  logout,
  commitSession,
} from "./session.server";
import { refreshAccessToken } from "./auth.server";
import envConfig from "@/config";
import { isTokenExpired } from "@/utils";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/contants/type";

const API_URL = envConfig.VITE_API_URL;

export interface ApiClientOptions extends AxiosRequestConfig {
  request: Request;
  requireAuth?: boolean; // Default: true
}

/**
 * Create axios instance với interceptor tự động refresh token
 */
function createApiClient(request: Request, requireAuth: boolean = true): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor
  client.interceptors.request.use(async (config) => {
    if (!requireAuth) {
      return config;
    }

    let accessToken = await getAccessToken(request);

    if (!accessToken) {
      throw await logout(request);
    }

    // Check token expired
    if (isTokenExpired(accessToken)) {
      const refreshToken = await getRefreshToken(request);
      if (!refreshToken) {
        throw await logout(request);
      }

      try {
        const newTokens = await refreshAccessToken(refreshToken);
        accessToken = newTokens.accessToken;

        // Update session
        const session = await getSession(request);
        session.set(ACCESS_TOKEN_KEY, newTokens.accessToken);
        if (newTokens.refreshToken) {
          session.set(REFRESH_TOKEN_KEY, newTokens.refreshToken);
        }
      } catch (error) {
        throw await logout(request);
      }
    }

    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && requireAuth) {
        const refreshToken = await getRefreshToken(request);
        if (!refreshToken) {
          throw await logout(request);
        }

        try {
          const newTokens = await refreshAccessToken(refreshToken);

          // Update session và commit
          const session = await getSession(request);
          session.set(ACCESS_TOKEN_KEY, newTokens.accessToken);
          if (newTokens.refreshToken) {
            session.set(REFRESH_TOKEN_KEY, newTokens.refreshToken);
          }

          // Commit session để lưu cookie
          throw new Response(null, {
            status: 302,
            headers: {
              Location: request.url,
              "Set-Cookie": await commitSession(session),
            },
          });
        } catch (refreshError) {
          throw await logout(request);
        }
      }

      throw error;
    }
  );

  return client;
}

/**
 * Fetch API using axios với tự động refresh token
 */
export async function apiFetch(
  url: string,
  options: ApiClientOptions
): Promise<any> {
  const { request, requireAuth = true, ...axiosConfig } = options;

  const client = createApiClient(request, requireAuth);

  try {
    const response = await client.request({
      url,
      ...axiosConfig,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Helper function để parse response JSON
 */
export async function apiFetchJson<T>(
  url: string,
  options: ApiClientOptions
): Promise<T> {
  const response = await apiFetch(url, options);
  // console.log("🚀 ~ apiFetchJson ~ response.data:", response.data)
  return response.data as T;
}
