import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { createUserSession, getUser } from '@/services/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const identifier = formData.get('identifier');
  const password = formData.get('password');

  if (typeof identifier !== 'string' || typeof password !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid form submission', timestamp: Date.now() }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const trimmedIdentifier = identifier.trim();
  const trimmedPassword = password.trim();

  // Mock authentication logic; replace with real user lookup
  const isValidUser = trimmedIdentifier === 'demouser' && trimmedPassword === 'password';
  if (!isValidUser) {
    return new Response(JSON.stringify({ error: 'Invalid username or password', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return createUserSession({
    request,
    user: { userId: '1', roles: ['user'] },
    refreshToken: 'mock-refresh-token',
    accessToken: 'mock-access-token',
    remember: true
  });
}

export default function SignIn() {
  return null;
}
