import { getUser, createUserSession } from "@/services/server/session.server";
import { signupToBE } from "@/services/server/auth.server";
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import type { TSignupBodyValues } from "@/models/auth.model";
import type { Role } from "@/contants/type";

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
    return new Response(JSON.stringify({ error: 'Username, email, password, and code are required', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Call BE signup API
    const payload: TSignupBodyValues = {
      username: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
      code: trimmedCode,
      fullName: trimmedFullName,
      phoneNumber: trimmedPhoneNumber,
    };

    const signupResponse = await signupToBE(payload);

    // Map roles từ BE (uppercase) sang FE (lowercase)
    const roles: Role[] = signupResponse.roles.map((role) => role.toLowerCase() as Role);

    // Tạo session và redirect
    return createUserSession({
      request,
      user: {
        userId: signupResponse.userId,
        roles,
      },
      refreshToken: signupResponse.refreshToken,
      accessToken: signupResponse.accessToken,
      remember: true,
    });
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
