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

    // Create user session (without redirect - let client handle navigation)
    const headers = await createUserSession({
      request,
      user: {
        userId: authData.userId,
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
