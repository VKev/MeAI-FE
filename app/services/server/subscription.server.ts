import type { SubscriptionListResponse } from "@/models/subscription.model";
import { serverApiFetch } from "@/services/server/api.server";

export async function fetchSubscriptions(request: Request) {
	const res = await serverApiFetch<SubscriptionListResponse>("/api/User/subscriptions", {
		request,
		method: "GET",
		requireAuth: false,
	});
  console.log("🚀 ~ fetchSubscriptions ~ res:", res)
  return res;
}
