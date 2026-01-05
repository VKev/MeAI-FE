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
