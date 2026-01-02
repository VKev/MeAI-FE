import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { createUserSession, getUserId } from '@/services/session.server';

const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const identifier = formData.get('identifier');
  const password = formData.get('password');

  if (typeof identifier !== 'string' || typeof password !== 'string') {
    return jsonResponse({ error: 'Invalid form submission' }, { status: 400 });
  }

  const trimmedIdentifier = identifier.trim();
  const trimmedPassword = password.trim();

  // Mock authentication logic; replace with real user lookup
  const isValidUser = trimmedIdentifier === 'demouser' && trimmedPassword === 'password';
  if (!isValidUser) {
    return jsonResponse({ error: 'Invalid username or password' }, { status: 400 });
  }

  return createUserSession({
    request,
    userId: 'user-1',
    remember: true,
    redirectUrl: '/user/dashboard',
  });
}

export default function SignIn() {
  return null;
}
