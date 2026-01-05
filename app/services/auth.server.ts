import envConfig from "@/config";
import type { SigninResponse, TSigninValues } from "@/models/auth.model";
import axios from "axios";

const API_URL = envConfig.VITE_API_URL;

export async function signinToBE(payload: TSigninValues) {
  try {
    const response = await axios.post<SigninResponse>(
      `${API_URL}/api/User/auth/login`,
      payload
    );

    // console.log("🚀 ~ signinToBE ~ response.data:", response.data)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Login failed");
    }

    return response.data.value;
  } catch (error) {
    // console.log("🚀 ~ signinToBE ~ error:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;
      
      // BE trả về Problem Details format khi error
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      
      // Fallback: Kiểm tra format cũ (nếu có)
      if (errorData.error?.description) {
        throw new Error(errorData.error.description);
      }
    }
    
    throw new Error("Login failed");
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`);

    return response.data as {
      accessToken: string;
      refreshToken?: string;
    };
  } catch (error) {
    throw new Error("Refresh failed");
  }
}
