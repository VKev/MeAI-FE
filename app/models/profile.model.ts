import z from "zod";

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

// Profile type 
export type TProfile = TGetMeResponse['value'];

// Update profile request 
export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().min(1).max(15).optional(),
  address: z.string().min(1).max(255).optional(),
  birthday: z.string().optional(),
  avatarResourceId: z.string().optional(),
});

export type TUpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;