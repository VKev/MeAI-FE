export type PaymentCard = {
  paymentMethodId: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  funding: string | null;
  country: string | null;
  cardholderName: string | null;
  isDefault: boolean;
  isExpired: boolean;
};

export type PaymentCardsListResponse = {
  value: PaymentCard[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
    metadata: null;
  };
};

export type SetupIntentResponse = {
  value: {
    setupIntentId: string;
    clientSecret: string;
    stripeCustomerId: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
    metadata: null;
  };
};

export type SetDefaultCardResponse = {
  value: PaymentCard;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
    metadata: null;
  };
};

export type DeleteCardResponse = {
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
    metadata: null;
  };
};
