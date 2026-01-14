import { clientApiFetch } from "@/services/client/api.client";
import type { SubscriptionListResponse } from "@/models/subscription.model";

export async function fetchSubscriptionsClient() {
  return clientApiFetch<SubscriptionListResponse>("/api/User/subscriptions", {
    method: "GET",
  });
}
