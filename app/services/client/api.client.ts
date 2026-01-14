import axios, { type AxiosRequestConfig } from "axios";
import envConfig from "@/config";

const API_URL = envConfig.VITE_API_URL;

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
  config?: AxiosRequestConfig
): Promise<T> {
  const client = createClient();
  const response = await client.request<T>({ url, ...config });
  return response.data;
}