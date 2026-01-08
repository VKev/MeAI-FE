export const TokenType = {
  accessToken: "AccessToken",
  refreshToken: "RefreshToken",
} as const;

export const Role = {
  admin: "admin",
  user: "user",
} as const;

export const RoleValues = [
  Role.admin,
  Role.user,
] as const;

export type Role = "admin" | "user";

export const VerificationType = {
  register: "register",
  forgotPassword: "forgot-password",
} as const;

export type VerificationType = "register" | "forgot-password";

export const USER_KEY = "user";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const ACCESS_TOKEN_KEY = "accessToken";