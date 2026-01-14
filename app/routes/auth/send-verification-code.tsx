
import { type ActionFunctionArgs } from 'react-router';
import { registerVerificationCode, forgotPasswordVerificationCode } from '@/services/server/otp-code.server';
import { VerificationType } from '@/contants/type';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const type = formData.get('type');

    if (typeof email !== 'string' || !email.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof type !== 'string' || !type.trim()) {
      return new Response(JSON.stringify({ error: 'Type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmedEmail = email.trim();
    const trimmedType = type.trim();

    let response;

    if (trimmedType === VerificationType.register) {
      response = await registerVerificationCode(trimmedEmail);
    } else if (trimmedType === VerificationType.forgotPassword) {
      response = await forgotPasswordVerificationCode(trimmedEmail);
    } else {
      return new Response(JSON.stringify({ error: `Invalid type. Must be "${VerificationType.register}" or "${VerificationType.forgotPassword}"` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default function SendVerificationCode() {
  return null;
}
