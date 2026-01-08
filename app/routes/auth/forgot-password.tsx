import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { getUser } from '@/services/server/session.server';
import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { resetPasswordToBE } from '@/services/server/auth.server';
import type { TResetPasswordBodyValues } from '@/models/auth.model';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const newPassword = formData.get('newPassword');
  const code = formData.get('code');

  if (typeof email !== 'string' || typeof newPassword !== 'string' || typeof code !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid form submission', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const payload: TResetPasswordBodyValues = {
    email: email.trim(),
    newPassword: newPassword.trim(),
    code: code.trim()
  };

  if (!payload.email || !payload.newPassword || !payload.code) {
    return new Response(JSON.stringify({ error: 'All fields are required', timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await resetPasswordToBE(payload);
    const message = data?.message || 'Password reset successfully. Please sign in again.';
    return new Response(JSON.stringify({ isSuccess: true, value: { message } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Reset password failed';
    return new Response(JSON.stringify({ error: errorMessage, timestamp: Date.now() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}
