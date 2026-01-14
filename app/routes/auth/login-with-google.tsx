import type { ActionFunctionArgs } from 'react-router';
import { loginWithGoogle } from '@/services/server/auth.server';
import { createUserSession } from '@/services/server/session.server';
import type { Role } from '@/contants/type';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const idToken = formData.get('idToken');

    if (!idToken || typeof idToken !== 'string') {
      return new Response(JSON.stringify({ error: 'ID token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: authData, setCookie } = await loginWithGoogle(idToken);

    const roles: Role[] = authData.roles.map((role) => role.toLowerCase() as Role);

    // Create user session, forward Set-Cookie from BE to client and redirect based on roles
    return createUserSession({
      request,
      user: {
        userId: authData.userId,
        roles
      },
      setCookie
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Google login failed';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default function LoginWithGoogle() {
  return null;
}
