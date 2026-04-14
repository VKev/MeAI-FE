import { isAtLeastAge } from "@/utils";
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
    avatarPresignedUrl: string | null;
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

const PHONE_NUMBER_DIGITS_REGEX = /^[1-9]\d{0,12}$/;
const ADULT_AGE = 18;

export const UpdateProfileFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  phoneNumber: z
    .union([z.literal(''), z.string().regex(PHONE_NUMBER_DIGITS_REGEX, 'Phone number is invalid')])
    .optional(),
  address: z.union([z.literal(''), z.string().max(255, 'Address is too long')]).optional(),
  birthday: z
    .string()
    .optional()
    .refine((value) => isAtLeastAge(value, ADULT_AGE), { message: 'You must be at least 18 years old' })
});

export type UpdateProfileData = z.infer<typeof UpdateProfileFormSchema>;

export type TUpdateProfilePayload = {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  birthday?: string;
}

// Upload avatar response
export type TUploadAvatarResponse = {
  value: {
    id: string,
    link: string,
    status: string | null,
    resourceType: string | null,
    contentType: string | null,
    createdAt: string | null,
    updatedAt: string | null
  },
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string,
    description: string
  }
};