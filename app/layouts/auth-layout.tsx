import { AuthCard } from '@/routes/auth/auth-card';
import { getUser } from '@/services/session.server';
import { Outlet, useLocation, Link, redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isForgot = pathname.endsWith('/forgot-password');
  const mode = pathname.endsWith('/sign-up') ? 'sign-up' : 'sign-in';

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-r from-gray-200 to-blue-200 relative'>
      <Link to='/' className='absolute top-6 left-[30%] -translate-x-1/2 flex items-center justify-center'>
        <img src='/logo.png' alt='MeAI' className='h-12 w-auto' />
      </Link>

      {isForgot ? <Outlet /> : <AuthCard mode={mode} />}
      {!isForgot && <Outlet />}
    </div>
  );
}
