import type { TGetMeResponse } from "@/models/profile.model";
import { serverApiFetch } from "@/services/server/api.server";

export async function fetchAuthMe(request: Request) {
  return serverApiFetch<TGetMeResponse>("/api/User/auth/me", {
    request,
    method: "GET",
    requireAuth: false,
  });
}
