import type { TGetMeResponse } from "@/models/profile.model";
import { clientFetch } from "@/services/client/api.client";

export async function fetchAuthMe() {
  return clientFetch<TGetMeResponse>("/api/User/auth/me", {
    method: "GET",
  }, { auth: true });
}