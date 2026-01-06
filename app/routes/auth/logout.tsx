import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { logout, getAccessToken } from '@/services/server/session.server';
import { logoutToBE } from '@/services/server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  // Lấy accessToken trước khi destroy session
  const accessToken = await getAccessToken(request);

  if (accessToken) {
    try {
      await logoutToBE(accessToken);
    } catch (error) {
      // Log error nhưng vẫn tiếp tục logout
      console.error('BE logout failed:', error);
    }
  }

  // Destroy session và redirect
  return logout(request);
}

export async function loader({}: LoaderFunctionArgs) {
  return redirect('/auth/sign-in');
}

export default function Logout() {
  return null;
}
