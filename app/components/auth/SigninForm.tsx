import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useFetcher, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { SigninSchema, type TSigninValues } from '@/models/auth.model';
import { toast } from 'react-toastify';

type Props = {
  isActive: boolean;
};

export default function SigninForm({ isActive }: Props) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TSigninValues>({
    resolver: zodResolver(SigninSchema),
    defaultValues: { emailOrUsername: '', password: '' }
  });

  const isSubmitting = fetcher.state === 'submitting';

  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string; redirectPath?: string } | undefined;

    if (fetcher.state === 'idle' && data) {
      if (data.error) {
        toast.error(data.error);
      } else if (data.success && data.redirectPath) {
        toast.success('Signin successful!');

        // Invalidate session-check so authenticated layouts can refresh user state.
        queryClient.invalidateQueries({ queryKey: ['session-check'] });

        navigate(data.redirectPath, { replace: true });
      }
    }
  }, [fetcher.data, fetcher.state, navigate, queryClient]);

  const onSubmit = handleSubmit((values) => {
    const redirectTo = searchParams.get('redirectTo');

    fetcher.submit(
      { ...values, ...(redirectTo && { redirectTo }) },
      {
        method: 'post',
        action: '/auth/sign-in'
      }
    );
  });

  return (
    <div
      className={`absolute inset-y-0 left-0 w-full transition-all duration-500 ease-out md:w-1/2 ${
        isActive ? 'pointer-events-none z-0 opacity-0 md:translate-x-full' : 'z-10 opacity-100 md:translate-x-0'
      }`}
    >
      <div className='auth-scroll-area flex h-full flex-col items-center justify-center overflow-y-auto px-6 pb-10 pt-16 sm:px-10 sm:pt-20'>
        <div className='w-full max-w-105'>
          <p className='mb-2 text-xs font-semibold tracking-widest text-white/46 uppercase'>MeAI account</p>
          <h1 className='mb-2 text-3xl leading-tight font-semibold text-white sm:text-4xl'>Sign in to continue</h1>
          <p className='mb-6 text-sm leading-6 text-white/60'>
            Manage your workspace, campaigns, and channels from one command center.
          </p>
        </div>

        <form className='w-full max-w-105 space-y-3.5' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Input
              type='text'
              placeholder='Username or email'
              aria-invalid={!!errors.emailOrUsername}
              className='h-11 rounded-xl border-white/12 bg-black/35 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
              {...register('emailOrUsername', { required: 'Username or email is required' })}
            />
            {errors.emailOrUsername && <p className='text-xs text-red-500'>{errors.emailOrUsername.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                aria-invalid={!!errors.password}
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-10 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type='button'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-white/44 hover:text-white/70 focus-visible:outline-none'
              >
                {showPassword ? (
                  <EyeOff className='size-5' strokeWidth={1.5} />
                ) : (
                  <Eye className='size-5' strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password && <p className='text-xs text-red-500'>{errors.password.message}</p>}
          </div>

          <div className='flex items-center justify-end text-xs font-normal text-gray-300'>
            <Link to='/auth/forgot-password' className='text-white/65 transition-colors hover:text-white'>
              Forgot your password?
            </Link>
          </div>

          <Button
            type='submit'
            size='default'
            className='h-11 w-full rounded-xl bg-[linear-gradient(92deg,#7b46f8_0%,#b057f4_100%)] text-xs font-semibold tracking-widest text-white uppercase transition hover:brightness-110'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className='mt-4 w-full max-w-105 text-center text-xs text-white/52'>
          <span>Do not have an account? </span>
          <Link to='/auth/sign-up' className='font-medium text-white/82 transition-colors hover:text-white'>
            Create one
          </Link>
        </div>

        <div className='mt-8 w-full max-w-105 space-y-3'>
          <div className='flex items-center gap-2 text-xs text-white/40'>
            <span className='h-px flex-1 bg-white/14' />
            <span>Or sign in with</span>
            <span className='h-px flex-1 bg-white/14' />
          </div>

          <GoogleLoginButton variant='signin' />
        </div>
      </div>
    </div>
  );
}
