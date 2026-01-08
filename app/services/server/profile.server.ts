import type { TGetMeResponse } from "@/models/profile.model";
import { apiFetchJson } from "@/services/server/api.server";

export async function fetchAuthMe(request: Request) {
  return apiFetchJson<TGetMeResponse>("/api/User/auth/me", {
    request,
    method: "GET",
    requireAuth: true,
  });
}
