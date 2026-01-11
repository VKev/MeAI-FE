import { apiFetchJson } from "./api.server";

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
	return apiFetchJson<StripePurchaseResponse>(
		`/api/User/subscriptions/${subscriptionId}/purchase`,
		{
			request,
			method: "POST",
			requireAuth: true,
		}
	);
}
