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
