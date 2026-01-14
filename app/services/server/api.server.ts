import axios, { type AxiosRequestConfig } from "axios";
import envConfig from "@/config";
import { refreshSessionAction } from "@/services/server/auth.server";

const API_URL = envConfig.VITE_API_URL;

export interface ServerApiOptions extends AxiosRequestConfig {
  request: Request;
  requireAuth?: boolean; // default true
}

/**
 * Create axios instance với interceptor tự động refresh token
 */
export async function serverApiFetch<T = any>(
  url: string,
  options: ServerApiOptions
): Promise<T> {
  const { request, requireAuth = true, ...config } = options;

  try {
    const res = await axios.request<T>({
      baseURL: API_URL,
      url,
      ...config,
      headers: {
        ...config.headers,
        cookie: request.headers.get("cookie") ?? "",
      },
      withCredentials: true,
    });

    return res.data;
  } catch (error: any) {
    // Không cần auth → throw luôn
    if (!requireAuth) throw error;

    // Nếu không phải 401 → throw
    if (error.response?.status !== 401) {
      throw error;
    }

    // 401 → thử refresh
    const refreshResponse = await refreshSessionAction(request);

    // refresh fail → redirect đã được trả về
    if (refreshResponse instanceof Response) {
      throw refreshResponse;
    }

    // refresh OK → retry request
    const retryRes = await axios.request<T>({
      baseURL: API_URL,
      url,
      ...config,
      headers: {
        ...config.headers,
        cookie: request.headers.get("cookie") ?? "",
      },
      withCredentials: true,
    });

    return retryRes.data;
  }
}

