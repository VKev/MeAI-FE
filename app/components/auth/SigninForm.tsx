import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useFetcher, useNavigate } from 'react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SigninSchema, type TSigninValues } from '@/models/auth.model';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

type Props = {
  isActive: boolean;
};

export default function SigninForm({ isActive }: Props) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
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
        // Login thành công → AppProvider sẽ tự động fetch user từ BE
        toast.success('Signin successful!');
        navigate(data.redirectPath);
      }
    }
  }, [fetcher.data, fetcher.state, navigate]);

  const onSubmit = handleSubmit((values) => {
    fetcher.submit(values, {
      method: 'post',
      action: '/auth/sign-in'
    });
  });

  return (
    <div
      className={`absolute top-0 h-full w-1/2 left-0 transition-all duration-600 ease-in-out ${
        isActive ? 'translate-x-full z-5 opacity-0 invisible' : 'translate-x-0 z-2 opacity-100'
      }`}
    >
      <div className='flex items-center justify-center flex-col px-10 h-full'>
        <h1 className='text-3xl font-bold mb-6 text-white'>Sign in</h1>
        <form className='w-full space-y-3' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Input
              type='text'
              placeholder='Username or email'
              aria-invalid={!!errors.emailOrUsername}
              className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
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
                className='pr-10 text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type='button'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
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
            <Link to='/auth/forgot-password' className='text-blue-400 hover:text-blue-300 hover:underline'>
              Forget your password?
            </Link>
          </div>

          <Button
            type='submit'
            size='default'
            className='w-full text-xs uppercase bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className='w-full mt-8 space-y-3'>
          <div className='flex items-center gap-2 text-xs text-gray-400'>
            <span className='h-px flex-1 bg-gray-600' />
            <span>Or sign in with</span>
            <span className='h-px flex-1 bg-gray-600' />
          </div>

          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
