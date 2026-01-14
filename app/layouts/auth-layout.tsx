import { AuthCard } from '@/routes/auth/auth-card';
import { getRedirectByRoles, getUser } from '@/services/server/session.server';
import { Outlet, useLocation, Link, redirect, type LoaderFunctionArgs } from 'react-router';

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
    <div className='min-h-screen flex items-center justify-center bg-[#0a0a0f] relative'>
      
      {/* Global Background - Single unified layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern - consistent across all sections */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[64px_64px]" />

        {/* Global gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-purple-900/10 via-transparent to-pink-900/10" />
      </div>

      {/* Floating Glow Orbs - positioned globally for flow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb-purple top-[5%] -left-[10%] opacity-20 animate-pulse-glow" />
        <div className="glow-orb-magenta top-[25%] -right-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="glow-orb-cyan top-[45%] -left-[8%] opacity-15 animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="glow-orb-purple top-[65%] -right-[10%] opacity-20 animate-pulse-glow" style={{ animationDelay: '3s' }} />
        <div className="glow-orb-magenta top-[85%] -left-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '5s' }} />
      </div>

      <Link to='/' className='absolute top-6 left-[30%] -translate-x-1/2 flex items-center justify-center'>
        <img src='/logo.png' alt='MeAI' className='h-12 w-auto' />
      </Link>

      {isForgot ? <Outlet /> : <AuthCard mode={mode} />}
      {!isForgot && <Outlet />}
    </div>
  );
}
