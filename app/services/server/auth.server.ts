import axios from "axios";
import envConfig from "@/config";
import type { TAuthResponse, TResetPasswordBodyValues, TResetPasswordResponse, TSigninValues, TSignupBodyValues } from "@/models/auth.model";

const API_URL = envConfig.VITE_API_URL;

export async function signinToBE(payload: TSigninValues) {
  try {
    const response = await axios.post<TAuthResponse>(
      `${API_URL}/api/User/auth/login`,
      payload
    );

    // console.log("🚀 ~ signinToBE ~ response.data:", response.data)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Login failed");
    }

    return response.data.value;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      // console.log("🚀 ~ signinToBE ~ error.response?.data:", error.response?.data)
      const errorData = error.response.data;

      if (errorData.detail) {
        throw new Error(errorData.detail);
      }

      // Fallback (optional)
      if (errorData.error?.description) {
        throw new Error(errorData.error.description);
      }
    }

    throw new Error("Login failed");
  }
}

export async function signupToBE(payload: TSignupBodyValues) {
  try {
    const response = await axios.post<TAuthResponse>(
      `${API_URL}/api/User/auth/register`,
      payload
    );

    // console.log("🚀 ~ signupToBE ~ response.data:", response.data)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Signup failed");
    }

    return response.data.value;
  } catch (error) {
    // console.log("🚀 ~ signupToBE ~ error:", error);
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

    throw new Error("Signup failed");
  }
}

export async function logoutToBE(accessToken: string) {
  try {
    await axios.post(
      `${API_URL}/api/User/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    // Log error but don't block logout process
    console.error("Logout failed:", error);
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post<TAuthResponse>(`${API_URL}/api/User/auth/refresh`);

    return response.data.value;
  } catch (error) {
    throw new Error("Refresh failed");
  }
}

export async function resetPasswordToBE(payload: TResetPasswordBodyValues) {
  try {
    const response = await axios.post<TResetPasswordResponse>(
      `${API_URL}/api/User/auth/reset-password`,
      payload
    );

    // console.log("🚀 ~ resetPasswordToBE ~ response.data:", response.data)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Reset password failed");
    }

    return response.data.value;
  } catch (error) {
    // console.log("🚀 ~ resetPasswordToBE ~ error:", error)
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

    throw new Error("Reset password failed");
  }
}
