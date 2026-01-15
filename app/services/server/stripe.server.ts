import { serverApiFetch } from "./api.server";

export type StripePurchaseResponse = {
	value: {
		checkoutUrl: string;
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
	console.log("🔵 [Stripe] Cookie value:", cookie?.substring(0, 100) + "...");

	try {
		const result = await serverApiFetch<StripePurchaseResponse>(
			`/api/User/subscriptions/${subscriptionId}/purchase`,
			{
				request,
				method: "POST",
				requireAuth: true,
				headers: {
					"Content-Type": "application/json",
				},
				data: {},
			}
		);
		console.log("🟢 [Stripe] Purchase success:", result);
		return result;
	} catch (error: any) {
		console.error("🔴 [Stripe] Purchase error:", {
			status: error?.response?.status,
			statusText: error?.response?.statusText,
			data: error?.response?.data,
			message: error?.message,
		});
		throw error;
	}
}
