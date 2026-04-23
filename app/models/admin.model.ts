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
  providerReferenceId: string | null;
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

export type AdminTransactionResponse = {
  value: AdminTransaction;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminTransactionDeleteResponse = {
  value: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export interface AdminConfig {
  id: string;
  chatModel: string | null;
  mediaAspectRatio: string | null;
  numberOfVariances: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export type AdminConfigResponse = {
  value: AdminConfig;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  actionType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminReportListResponse = {
  value: AdminReport[];
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};

export type AdminReportResponse = {
  value: AdminReport;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
