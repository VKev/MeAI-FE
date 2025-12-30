import { AuthCard } from '@/routes/auth/auth-card';
import { Outlet, useLocation } from 'react-router';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isForgot = pathname.endsWith('/forgot-password');
  const mode = pathname.endsWith('/signup') ? 'signup' : 'signin';

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-r from-gray-200 to-blue-200'>
      {isForgot ? <Outlet /> : <AuthCard mode={mode} />}
      {!isForgot && <Outlet />}
    </div>
  );
}
