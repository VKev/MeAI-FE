export type SubscriptionLimits = {
	number_of_social_accounts: number;
	rate_limit_for_content_creation: number;
	number_of_workspaces: number;
};

export type Subscription = {
	id: string;
	name: string;
	limits: SubscriptionLimits;
	cost: number;
	durationMonths: number;
	meAiCoin: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	isDeleted: boolean;
};

export type CurrentUserSubscription = {
	userSubscriptionId: string;
	subscriptionId: string;
	subscriptionName: string | null;
	activeDate: string | null;
	endDate: string | null;
	status: string | null;
	isActive: boolean;
};

export type SubscriptionListResponse = {
	value: Subscription[];
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};

export type CurrentUserSubscriptionResponse = {
	value: CurrentUserSubscription | null;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};
