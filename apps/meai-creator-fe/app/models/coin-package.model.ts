export type CoinPackage = {
  id: string;
  name: string;
  coinAmount: number;
  bonusCoins: number;
  totalCoins: number;
  price: number;
  currency: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type CoinPackageListResponse = {
  value: CoinPackage[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type CoinPackageCheckoutRequest = {
  packageId: string;
};

export type CoinPackageCheckoutResponse = {
  value: {
    packageId: string;
    transactionId: string;
    paymentIntentId: string;
    clientSecret: string;
    status: string;
    amountDue: number;
    currency: string;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type CoinPackageResolveCheckoutRequest = {
  paymentIntentId: string;
  transactionId: string;
};

export type CoinPackageResolveCheckoutResponse = {
  value: {
    packageId: string;
    transactionId: string;
    paymentIntentId: string;
    status: string;
    isFinal: boolean;
    coinsCredited: boolean;
    alreadyCredited: boolean;
    creditedCoins: number;
    currentBalance: number;
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
