import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { signinToBE } from '@/services/server/auth.server';
import type { TSigninValues } from '@/models/auth.model';
import type { Role } from '@/contants/type';
import { createUserSession, getUser } from '@/services/server/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const emailOrUsername = formData.get('emailOrUsername');
  const password = formData.get('password');

  if (typeof emailOrUsername !== 'string' || typeof password !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid form submission', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const trimmedEmailOrUsername = emailOrUsername.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmailOrUsername || !trimmedPassword) {
    return new Response(JSON.stringify({ error: 'Username and password are required', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Call BE login API
    const payload: TSigninValues = {
      emailOrUsername: trimmedEmailOrUsername,
      password: trimmedPassword
    };

    const { data: loginResponse, setCookie } = await signinToBE(payload);

    // Map roles từ BE (uppercase) to FE (lowercase)
    const roles: Role[] = loginResponse.roles.map((role) => role.toLowerCase() as Role);

    // Create user session (without redirect - let client handle navigation)
    const headers = await createUserSession({
      request,
      user: {
        userId: loginResponse.userId,
        roles
      },
      setCookie,
      shouldRedirect: false
    }) as Headers;

    // Return JSON response with Set-Cookie headers
    const redirectPath = roles.includes('admin') ? '/admin' : roles.includes('user') ? '/user' : '/';
    headers.set('Content-Type', 'application/json');

    return new Response(
      JSON.stringify({ success: true, redirectPath, timestamp: Date.now() }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return new Response(JSON.stringify({ error: errorMessage, timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default function SignIn() {
  return null;
}
