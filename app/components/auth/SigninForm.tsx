import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SigninSchema, type SigninValues } from '@/models/auth.model';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  isActive: boolean;
};

export default function SigninForm({ isActive }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SigninValues>({
    resolver: zodResolver(SigninSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    // TODO: replace with real sign-in action
    console.log('Sign in', values);
  });

  return (
    <div
      className={`absolute top-0 h-full w-1/2 left-0 transition-all duration-600 ease-in-out ${
        isActive ? 'translate-x-full z-5 opacity-0 invisible' : 'translate-x-0 z-2 opacity-100'
      }`}
    >
      <div className='bg-white flex items-center justify-center flex-col px-10 h-full'>
        <h1 className='text-3xl font-bold mb-6'>Sign in</h1>
        <form className='w-full space-y-3' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Input
              type='email'
              placeholder='Email'
              aria-invalid={!!errors.email}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                aria-invalid={!!errors.password}
                className='pr-10'
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

          <div className='flex items-center justify-end text-xs font-normal text-[#333]'>
            <Link to='/auth/forgot-password' className='hover:underline'>
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
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <span className='h-px flex-1 bg-gray-200' />
            <span>Or sign in with</span>
            <span className='h-px flex-1 bg-gray-200' />
          </div>

          <div className='flex justify-center'>
            <Button
              type='button'
              variant='outline'
              className='w-full max-w-xs justify-center gap-2 text-sm border-gray-300 hover:border-gray-400 hover:bg-white'
            >
              <svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>
                <path
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  fill='#4285F4'
                ></path>
                <path
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  fill='#34A853'
                ></path>
                <path
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  fill='#FBBC05'
                ></path>
                <path
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  fill='#EA4335'
                ></path>
                <path d='M1 1h22v22H1z' fill='none'></path>
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
