import SigninForm from '@/components/auth/SigninForm';
import SignupForm from '@/components/auth/SignupForm';
import ToggleContainer from '@/components/auth/ToggleContainer';

type AuthMode = 'signin' | 'signup';

export function AuthCard({ mode }: { mode: AuthMode }) {
  const isActive = mode === 'signup';

  return (
    <div className='relative bg-white rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] overflow-hidden w-3xl max-w-full min-h-145 max-h-[90vh]'>
      {/* Sign Up Form */}
      <SignupForm isActive={isActive} />

      {/* Sign In Form */}
      <SigninForm isActive={isActive} />

      {/* Toggle Container */}
      <ToggleContainer isActive={isActive} />
    </div>
  );
}
