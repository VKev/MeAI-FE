import type { TGetMeResponse, TProfile, TUpdateProfileRequest } from "@/models/profile.model";
import { clientFetch } from "@/services/client/api.client";

export async function fetchAuthMe() {
  return clientFetch<TGetMeResponse>("/api/User/auth/me", {
    method: "GET",
  }, { auth: true });
}

export async function updateProfile(data: TUpdateProfileRequest) {
  return clientFetch<TGetMeResponse>("/api/User/auth/profile", {
    method: "PUT",
    data,
  }, { auth: true });
}