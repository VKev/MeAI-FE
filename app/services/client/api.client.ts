import axios, { type AxiosRequestConfig } from "axios";
import envConfig from "@/config";

const API_URL = envConfig.VITE_API_URL;

export interface ClientApiOptions extends AxiosRequestConfig {
  requireAuth?: boolean; // chỉ để phân biệt, không gắn token ở client
}

function createClient() {
  return axios.create({
    baseURL: API_URL,
    withCredentials: true, // gửi cookie nếu có
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Call BE từ browser (guest/public). Không tự gắn Bearer token.
 */
export async function clientApiFetch<T = any>(
  url: string,
  options?: ClientApiOptions
): Promise<T> {
  const { requireAuth = false, ...config } = options ?? {};

  // Lưu ý: nếu requireAuth = true nhưng token là httpOnly → vẫn không đọc/gắn được ở client.
  const client = createClient();
  const response = await client.request<T>({ url, ...config });
  return response.data;
}