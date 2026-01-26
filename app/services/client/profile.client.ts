import type { TGetMeResponse, TProfile } from "@/models/profile.model";
import { clientFetch } from "@/services/client/api.client";

export async function fetchAuthMe() {
  return clientFetch<TGetMeResponse>("/api/User/auth/me", {
    method: "GET",
  }, { auth: true });
}

export async function updateProfile(data: Partial<TProfile>) {
  return clientFetch<TGetMeResponse>("/api/User/profile/update", {
    method: "PUT",
    data,
  }, { auth: true });
}