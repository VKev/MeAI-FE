import { AuthCard } from '@/routes/auth/auth-card';
import { getRedirectByRoles, getUser } from '@/services/server/session.server';
import { Outlet, useLocation, redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect(getRedirectByRoles(user.roles));
  }
  return null;
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isForgot = pathname.endsWith('/forgot-password');
  const mode = pathname.endsWith('/sign-up') ? 'sign-up' : 'sign-in';

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#050507] text-white'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 auth-background-grid' />
        <div className='absolute inset-0 auth-background-wash' />
        <div className='absolute inset-0 auth-background-conic opacity-70' />
        <div className='absolute left-1/2 top-1/2 h-[760px] w-[1280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(120,83,226,0.32),rgba(60,44,108,0.12)_44%,rgba(5,5,7,0)_76%)]' />
        <div className='absolute left-1/2 top-[-180px] h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,84,255,0.26),rgba(143,84,255,0)_70%)] blur-3xl auth-background-drift' />
        <div className='auth-background-ribbon absolute -left-[16%] top-[12%] h-[540px] w-[980px] rotate-[-9deg] opacity-42' />
        <div className='auth-background-ribbon absolute -right-[18%] bottom-[4%] h-[500px] w-[920px] rotate-[8deg] opacity-34' />
        <div className='absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#7a45f3]/16 blur-[110px] auth-background-drift-reverse' />
        <div className='absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-[#ec78f4]/12 blur-[110px] auth-background-drift' />
        <div className='absolute inset-0 auth-background-noise opacity-[0.18]' />
        <div className='absolute inset-0 auth-background-vignette' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(6,8,12,0)_38%,rgba(6,8,12,0.62)_100%)]' />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,7,0.2)_0%,rgba(5,5,7,0.56)_52%,#050507_100%)]' />
      </div>

      <div className='relative z-10 flex min-h-screen flex-col'>
        <div className='mx-auto flex w-full max-w-[1240px] flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-6'>
          {isForgot ? <Outlet /> : <AuthCard mode={mode} />}
          {!isForgot && <Outlet />}
        </div>
      </div>
    </div>
  );
}
