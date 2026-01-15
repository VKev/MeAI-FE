import envConfig from "@/config";
import { USER_KEY, type Role } from "@/contants/type";
import { createCookieSessionStorage, redirect } from "react-router";

// Check if user has a specific role
export function hasRole(
  user: SessionUser,
  role: Role
): boolean {
  return user.roles.includes(role);
}

// Determine redirect path based on user roles
export function getRedirectByRoles(roles: Role[]) {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("user")) return "/user";
  return "/";
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/auth/sign-in");
  }
  return user;
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


export async function createUserSession({
  request,
  user,
  setCookie,
  redirectTo
}: {
  request: Request;
  user: SessionUser;
  setCookie?: string | string[];
  redirectTo?: string | null;
}) {
  const session = await getSession(request);

  // Set user info in session
  session.set(USER_KEY, user);

  // Prepare headers
  const headers = new Headers();

  // Commit session from FE server to client
  headers.append(
    "Set-Cookie",
    await commitSession(session)
  );

  // Forward Set-Cookie from BE to client
  if (setCookie && Array.isArray(setCookie)) {
    setCookie.forEach((cookie) => headers.append('Set-Cookie', cookie));
  } else if (setCookie && typeof setCookie === 'string') {
    headers.append('Set-Cookie', setCookie);
  }

  // Use redirectTo if provided, otherwise redirect based on roles
  const targetUrl = redirectTo || getRedirectByRoles(user.roles);
  return redirect(targetUrl, { headers });
}
