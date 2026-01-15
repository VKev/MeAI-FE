import axios from "axios";
import envConfig from "@/config";
import type { TAuthResponse, TResetPasswordBodyValues, TResetPasswordResponse, TSigninValues, TSignupBodyValues } from "@/models/auth.model";
import { redirect } from "react-router";
import { destroySession, getSession } from "@/services/server/session.server";

const API_URL = envConfig.VITE_API_URL;

export async function signinToBE(payload: TSigninValues) {
  try {
    const response = await axios.post<TAuthResponse>(
      `${API_URL}/api/User/auth/login`,
      payload,
    );

    // console.log("🚀 ~ signinToBE ~ response:", response)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Login failed");
    }

    const setCookie = response.headers['set-cookie'];
    return { data: response.data.value, setCookie };
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

    // console.log("🚀 ~ signupToBE ~ response:", response)
    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Signup failed");
    }

    const setCookie = response.headers['set-cookie'];
    return { data: response.data.value, setCookie };
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

export async function loginWithGoogle(idToken: string) {
  try {
    const response = await axios.post<TAuthResponse>(
      `${API_URL}/api/User/auth/login/google`,
      { idToken }
    );
    // console.log("🚀 ~ loginWithGoogle ~ response:", response.data)

    if (!response.data.isSuccess) {
      throw new Error(response.data.error.description || "Google login failed");
    }

    const setCookie = response.headers['set-cookie'];
    return { data: response.data.value, setCookie };
  } catch (error) {
    // console.log("🚀 ~ loginWithGoogle ~ error:", error)
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;

      if (errorData.detail) {
        throw new Error(errorData.detail);
      }

      if (errorData.error?.description) {
        throw new Error(errorData.error.description);
      }
    }

    throw new Error("Google login failed");
  }
}

export async function logoutAction(request: Request) {
  const session = await getSession(request);
  const headers = new Headers();

  // 1️⃣ Call BE logout từ FE server
  try {
    const res = await axios.post(
      `${API_URL}/api/User/auth/logout`,
      {},
      {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        withCredentials: true,
      }
    );

    // 2️⃣ Forward Set-Cookie từ BE (clear token)
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach((c) => headers.append("Set-Cookie", c));
      } else {
        headers.append("Set-Cookie", setCookie);
      }
    }
  } catch (error) {
    // Không block logout FE
    console.error("BE logout failed:", error);
  }

  // 3️⃣ Destroy FE session
  headers.append(
    "Set-Cookie",
    await destroySession(session)
  );

  // 4️⃣ Redirect
  return redirect("/", { headers });
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

