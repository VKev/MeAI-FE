import type { TGetMeResponse } from "@/models/profile.model";
import { clientApiFetch } from "@/services/client/api.client";

export async function fetchAuthMeClient() {
  const res = await clientApiFetch<TGetMeResponse>("/api/User/auth/me", {
    method: "GET",
  });
  console.log("🚀 ~ fetchAuthMeClient ~ res:", res)
  return res;
}