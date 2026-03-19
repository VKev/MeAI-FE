export type AdminUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
  phoneNumber: string | null;
  provider: string | null;
  avatarResourceId: string | null;
  avatarPresignedUrl: string | null;
  address: string | null;
  birthday: string | null;
  meAiCoin: number | null;
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  roles: string[];
};

export type AdminUserListResponse = {
  value: AdminUser[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminUserResponse = {
  value: AdminUser;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminUserDeleteResponse = {
  value: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminTransactionUser = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  isDeleted: boolean;
};

export type AdminTransactionRelation = {
  type: string;
  id: string;
  subscription?: {
    id: string;
    name: string;
    cost: number;
    durationMonths: number;
    meAiCoin: number;
  };
};

export type AdminTransaction = {
  id: string;
  userId: string;
  relationId: string | null;
  relationType: string | null;
  cost: number;
  transactionType: string;
  tokenUsed: number | null;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  isDeleted: boolean;
  relation?: AdminTransactionRelation | null;
  user: AdminTransactionUser;
};

export type AdminTransactionListResponse = {
  value: AdminTransaction[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
