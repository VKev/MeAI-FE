import { fetcher } from "@/apis/fetcher";
import type { TAuthResponse, TResetPasswordBodyValues, TResetPasswordResponse, TSigninValues, TSignupBodyValues, TVerificationCodeResponse } from "@/models/auth.model";
import axios from "axios";

export const authApi = {
  async signin(data: TSigninValues): Promise<TAuthResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/login', data);
      return res.data;
    } catch (error) {
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
      throw new Error('Sign in failed');
    }
  },

  async signup(data: TSignupBodyValues): Promise<TAuthResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/register', data);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  async signout(): Promise<void> {
    try {
      await fetcher.post('/api/User/auth/logout');
    } catch (error) {
      throw error;
    }
  },

  async signinWithGoogle(idToken: string): Promise<TAuthResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/login/google', { idToken });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(data: TResetPasswordBodyValues): Promise<TResetPasswordResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/reset-password', data);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  async requestSignUpVerificationCode(email: string): Promise<TVerificationCodeResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/send-verification-code', { email });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  async requestResetPasswordVerificationCode(email: string): Promise<TVerificationCodeResponse> {
    try {
      const res = await fetcher.post('/api/User/auth/forgot-password', { email });
      return res.data;
    } catch (error) {
      throw error;
    }
  }
}