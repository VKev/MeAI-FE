import { getUser, createUserSession } from '@/services/server/session.server';
import { signupToBE } from '@/services/server/auth.server';
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import type { TSignupBodyValues } from '@/models/auth.model';
import type { Role } from '@/contants/type';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');
  const code = formData.get('code');
  const fullName = formData.get('fullName');
  const phoneNumber = formData.get('phoneNumber');

  // Validate required fields
  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof code !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'Invalid form submission', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const trimmedCode = code.trim();
  const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : undefined;
  const trimmedPhoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : undefined;

  if (!trimmedUsername || !trimmedEmail || !trimmedPassword || !trimmedCode) {
    return new Response(
      JSON.stringify({ error: 'Username, email, password, and code are required', timestamp: Date.now() }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Call BE signup API
    const payload: TSignupBodyValues = {
      username: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
      code: trimmedCode,
      fullName: trimmedFullName,
      phoneNumber: trimmedPhoneNumber
    };

    const { data: signupResponse, setCookie } = await signupToBE(payload);

    // Map roles từ BE (uppercase) to FE (lowercase)
    const roles: Role[] = signupResponse.roles.map((role) => role.toLowerCase() as Role);

    // Create user session (without redirect - let client handle navigation)
    const headers = await createUserSession({
      request,
      user: {
        userId: signupResponse.userId,
        roles
      },
      setCookie,
      shouldRedirect: false
    }) as Headers;

    // Return JSON response with Set-Cookie headers
    const redirectPath = roles.includes('admin') ? '/admin' : roles.includes('user') ? '/user/dashboard' : '/';
    headers.set('Content-Type', 'application/json');

    return new Response(
      JSON.stringify({ success: true, redirectPath, timestamp: Date.now() }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Signup failed';
    return new Response(JSON.stringify({ error: errorMessage, timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default function SignUp() {
  return null;
}
