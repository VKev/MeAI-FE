import SigninForm from '@/components/auth/SigninForm';
import SignupForm from '@/components/auth/SignupForm';
import ToggleContainer from '@/components/auth/ToggleContainer';

type AuthMode = 'sign-in' | 'sign-up';

export function AuthCard({ mode }: { mode: AuthMode }) {
  const isActive = mode === 'sign-up';

  return (
    <div className='relative h-[760px] w-full max-w-[1080px] overflow-hidden rounded-[30px] border border-white/12 bg-[#0a0d17]/74 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:h-[680px]'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(201,116,255,0.18),rgba(201,116,255,0)_35%),radial-gradient(circle_at_90%_100%,rgba(111,164,255,0.14),rgba(111,164,255,0)_32%)]' />

      {/* Sign Up Form */}
      <SignupForm isActive={isActive} />

      {/* Sign In Form */}
      <SigninForm isActive={isActive} />

      {/* Toggle Container */}
      <ToggleContainer isActive={isActive} />
    </div>
  );
}
