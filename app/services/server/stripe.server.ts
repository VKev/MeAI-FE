import axios from "axios";
import envConfig from "@/config";
import { redirect } from "react-router";

const API_URL = envConfig.VITE_API_URL;

export type StripePurchaseResponse = {
	value: {
		subscriptionId: string;
		cost: number;
		currency: string;
		amount: number;
		paymentIntentId: string;
		clientSecret: string;
		status: string;
		stripeSubscriptionId: string;
		renew: boolean;
		transactionId: string;
		subscriptionActivated: boolean;
		userSubscriptionId: string | null;
	};
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};

export async function createStripePurchase(
	request: Request,
	subscriptionId: string
): Promise<StripePurchaseResponse> {
	const cookie = request.headers.get("cookie");
	console.log("🔵 [Stripe] Creating purchase for subscription:", subscriptionId);
	console.log("🔵 [Stripe] Cookie present:", !!cookie);

	if (!cookie) {
		console.log("[Stripe] No auth cookie - redirecting to login");
		throw redirect("/auth/sign-in?redirectTo=/pricing");
	}

	try {
		const response = await axios.post<StripePurchaseResponse>(
			`${API_URL}/api/User/subscriptions/${subscriptionId}/purchase`,
			{
				paymentMethodId: null,
				renew: true
			},
			{
				headers: {
					"Content-Type": "application/json",
					cookie: cookie,
				},
				withCredentials: true,
			}
		);
		console.log("[Stripe] Purchase success:", response.data);
		return response.data;
	} catch (error: any) {
		console.error("[Stripe] Purchase error:", {
			status: error?.response?.status,
			statusText: error?.response?.statusText,
			data: error?.response?.data,
			message: error?.message,
		});
		throw error;
	}
}
