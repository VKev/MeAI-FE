export type SubscriptionLimits = {
  number_of_social_accounts: number;
  rate_limit_for_content_creation: number;
  number_of_workspaces: number | null;
  max_pages_per_social_account?: number | null;
  storage_quota_bytes: number;
  max_upload_file_bytes: number;
  retention_days_after_delete: number;
};

export type Subscription = {
  id: string;
  name: string;
  limits: SubscriptionLimits;
  cost: number;
  durationMonths: number;
  meAiCoin: number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
  isActive?: boolean;
};

export type CurrentUserSubscription = {
  userSubscriptionId: string;
  subscriptionId: string;
  subscriptionName: string | null;
  activeDate: string | null;
  endDate: string | null;
  status: string | null;
  isCurrent: boolean;
  isActive: boolean;
  isScheduled: boolean;
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

export type UserSubscriptionsResponse = {
  value: CurrentUserSubscription[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type SubscriptionResponse = {
	value: Subscription;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};

export type SubscriptionDeleteResponse = {
	value: boolean;
	isSuccess: boolean;
	isFailure: boolean;
	error: {
		code: string;
		description: string;
	};
};
