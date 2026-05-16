export type SubscriptionChangeType = 'new_purchase' | 'upgrade' | 'scheduled_change';

export type StripePurchaseResponse = {
  value: {
    subscriptionId: string;
    cost: number;
    currency: string;
    amount: number;
    creditApplied: number;
    paymentIntentId: string | null;
    clientSecret: string | null;
    status: string;
    stripeSubscriptionId: string | null;
    renew: boolean;
    transactionId: string;
    subscriptionActivated: boolean;
    scheduledChangeCreated: boolean;
    userSubscriptionId: string | null;
    changeType: SubscriptionChangeType;
    effectiveDate: string | null;
    requiresPayment: boolean;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type StripeConfirmPurchaseRequest = {
  paymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  transactionId: string | null;
  renew: boolean;
};

export type StripeConfirmPurchaseResponse = {
  value: {
    status: string;
    isFinal: boolean;
    subscriptionActivated: boolean;
    scheduledChangeCreated: boolean;
    userSubscriptionId: string | null;
    effectiveDate: string | null;
    changeType: SubscriptionChangeType;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
