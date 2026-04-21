import axios from 'axios';
import envConfig from '@/config';
import type { TVerificationCodeResponse } from '@/models/auth.model';

const API_URL = envConfig.VITE_API_URL;

export async function registerVerificationCode(email: string) {
  try {
    const response = await axios.post<TVerificationCodeResponse>(`${API_URL}/api/User/auth/send-verification-code`, {
      email
    });

    // console.log("🚀 ~ registerVerificationCode ~ response.data:", response.data)
    return response.data;
  } catch (error) {
    // console.log("🚀 ~ registerVerificationCode ~ error:", error)
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;

      if (errorData.detail) {
        throw new Error(errorData.detail);
      }

      // Fallback (optional)
      if (errorData.error?.description) {
        throw new Error(errorData.error.description);
      }
    }

    throw new Error('Send verification code failed');
  }
}

export async function forgotPasswordVerificationCode(email: string) {
  try {
    const response = await axios.post<TVerificationCodeResponse>(`${API_URL}/api/User/auth/forgot-password`, { email });

    // console.log("🚀 ~ forgotPasswordVerificationCode ~  response.data:",  response.data)
    return response.data;
  } catch (error) {
    // console.log("🚀 ~ forgotPasswordVerificationCode ~ error:", error)
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;

      if (errorData.detail) {
        throw new Error(errorData.detail);
      }

      // Fallback (optional)
      if (errorData.error?.description) {
        throw new Error(errorData.error.description);
      }
    }

    throw new Error('Send verification code failed');
  }
}
