export type StripePurchaseResponse = {
  value: {
    subscriptionId: string;
    cost: number;
    currency: string;
    amount: number;
    paymentIntentId: string | null;
    clientSecret: string | null;
    status: string;
    stripeSubscriptionId: string | null;
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
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
