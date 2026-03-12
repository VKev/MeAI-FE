import type { TGetMeResponse, TUpdateProfileRequest, TUploadAvatarResponse } from "@/models/profile.model";
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

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return clientFetch<TGetMeResponse>("/api/User/profile/avatar", {
    method: "PUT",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }, { auth: true });
}