import envConfig from "@/config";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, type Role } from "@/contants/type";
import { createCookieSessionStorage, redirect } from "react-router";

// Check if user has a specific role
export function hasRole(
  user: SessionUser,
  role: Role
): boolean {
  return user.roles.includes(role);
}

// Determine redirect path based on user roles
function getRedirectByRoles(roles: Role[]) {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("user")) return "/user";
  return "/";
}

export type SessionUser = {
  userId: string;
  roles: Role[];
};

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__meaiapp_session",
    secrets: [envConfig.VITE_SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: true,
  },
});

export const { commitSession, destroySession } = sessionStorage;

export const getSession = (request: Request) =>
  sessionStorage.getSession(request.headers.get("Cookie"));

export async function getUser(
  request: Request
): Promise<SessionUser | null> {
  const session = await getSession(request);
  return session.get(USER_KEY) ?? null;
}

export async function getRefreshToken(request: Request) {
  const session = await getSession(request);
  return session.get(REFRESH_TOKEN_KEY) as string | undefined;
}

export async function getAccessToken(request: Request) {
  const session = await getSession(request);
  return session.get(ACCESS_TOKEN_KEY) as string | undefined;
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/auth/sign-in");
  }
  return user;
}

export async function createUserSession({
  request,
  user,
  refreshToken,
  accessToken,
  remember = true,
}: {
  request: Request;
  user: SessionUser;
  refreshToken: string;
  accessToken: string;
  remember?: boolean;
}) {
  const session = await getSession(request);

  session.set(USER_KEY, user);
  session.set(REFRESH_TOKEN_KEY, refreshToken);
  session.set(ACCESS_TOKEN_KEY, accessToken);

  return redirect(getRedirectByRoles(user.roles), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember ? 60 * 60 * 24 * 7 : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

