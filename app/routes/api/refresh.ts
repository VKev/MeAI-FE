import axios from "axios";
import { type ActionFunctionArgs } from "react-router";
import envConfig from "@/config";

const API_URL = envConfig.VITE_API_URL;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    const res = await axios.post(
      `${API_URL}/api/User/auth/refresh`,
      null,
      {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        withCredentials: true,
      }
    );

    // Extract set-cookie from BE response and forward to client
    const headers = new Headers();
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      (Array.isArray(setCookie) ? setCookie : [setCookie]).forEach((c) =>
        headers.append("Set-Cookie", c)
      );
    }

    return new Response(null, { status: 200, headers });
  } catch (error: any) {
    const beStatus = error.response?.status;
    const beData = error.response?.data;

    console.log("refresh error from BE:", beStatus, beData);

    // refresh token invalid → logout
    if (
      beStatus === 400 &&
      beData?.type === "Auth.InvalidRefreshToken"
    ) {
      return new Response(
        JSON.stringify({ message: "Invalid refresh token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // fallback
    return new Response(
      JSON.stringify({ message: "Refresh failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}