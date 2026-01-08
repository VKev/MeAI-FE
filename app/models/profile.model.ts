// Response types
export type TGetMeResponse = {
  value: {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
    fullName: string | null;
    phoneNumber: string | null;
    provider: string | null;
    avatarResourceId: string | null;
    address: string | null;
    birthday: string | null;
    meAiCoin: number | string | null;
    isDeleted: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    deletedAt: string | null;
    roles: string[];
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
};
