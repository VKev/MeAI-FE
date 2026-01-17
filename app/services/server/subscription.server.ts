import type { SubscriptionListResponse } from "@/models/subscription.model";
import axios from "axios";
import envConfig from "@/config";

const API_URL = envConfig.VITE_API_URL;

/**
 * Fetch subscriptions - public endpoint that doesn't need auth cookies
 * We explicitly DON'T send cookies because backend returns 500 when it receives auth cookies
 */
export async function fetchSubscriptions(request: Request) {
	const res = await axios.get<SubscriptionListResponse>(`${API_URL}/api/User/subscriptions`);
	console.log("🚀 ~ fetchSubscriptions ~ res:", res.data);
	return res.data;
}
