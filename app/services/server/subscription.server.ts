import { apiFetchJson } from "./api.server";
import type { SubscriptionListResponse } from "@/models/subscription.model";

export async function fetchSubscriptions(request: Request) {
	const res = await apiFetchJson<SubscriptionListResponse>("/api/User/subscriptions", {
		request,
		method: "GET",
		requireAuth: false,
	});
  console.log("🚀 ~ fetchSubscriptions ~ res:", res)
  return res;
}
