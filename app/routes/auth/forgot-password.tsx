import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ForgotPasswordSchema, type TForgotPasswordValues } from '@/models/auth.model';
import { Link } from 'react-router';

export default function ForgotPassword() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues
  } = useForm<TForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '', newPassword: '', confirmNewPassword: '', code: '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    // TODO: wire up real reset-password action
    console.log('Forgot password submit', values);
  });

  const handleSendCode = () => {
    const email = getValues('email');

    if (!email) {
      setError('email', { type: 'manual', message: 'Email is required to send code' });
      return;
    }

    clearErrors('email');
    // TODO: integrate real code delivery
    console.log('Send reset code to', email);
  };

  return (
    <div className='bg-white flex items-center justify-center flex-col px-10 py-12 rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] overflow-hidden w-lg max-w-full min-h-100'>
      <h1 className='text-3xl font-bold mb-6'>Reset password</h1>

      <form className='w-full space-y-3' onSubmit={onSubmit}>
        <div className='space-y-1'>
          <Input type='email' placeholder='Email' aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
        </div>

        <div className='space-y-1'>
          <div className='relative'>
            <Input
              type={showNewPassword ? 'text' : 'password'}
              placeholder='New password'
              aria-invalid={!!errors.newPassword}
              className='pr-10'
              {...register('newPassword')}
            />
            <button
              type='button'
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showNewPassword}
              onClick={() => setShowNewPassword((prev) => !prev)}
              className='absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
            >
              {showNewPassword ? (
                <EyeOff className='size-5' strokeWidth={1.5} />
              ) : (
                <Eye className='size-5' strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.newPassword && <p className='text-xs text-red-500'>{errors.newPassword.message}</p>}
        </div>

        <div className='space-y-1'>
          <div className='relative'>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='Confirm new password'
              aria-invalid={!!errors.confirmNewPassword}
              className='pr-10'
              {...register('confirmNewPassword')}
            />
            <button
              type='button'
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className='absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
            >
              {showConfirmPassword ? (
                <EyeOff className='size-5' strokeWidth={1.5} />
              ) : (
                <Eye className='size-5' strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.confirmNewPassword && <p className='text-xs text-red-500'>{errors.confirmNewPassword.message}</p>}
        </div>

        <div className='space-y-1'>
          <div className='relative'>
            <Input
              type='text'
              placeholder='Code'
              aria-invalid={!!errors.code}
              className='pr-24'
              {...register('code')}
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
              onClick={handleSendCode}
            >
              Send
            </button>
          </div>
          {errors.code && <p className='text-xs text-red-500'>{errors.code.message}</p>}
        </div>

        <Button
          type='submit'
          size='default'
          className='w-full text-xs uppercase bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>

        <div className='flex items-center justify-end text-xs font-normal text-[#333] gap-1'>
          <span>Remembered Password?</span>
          <Link
            to='/auth/signin'
            className='text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
