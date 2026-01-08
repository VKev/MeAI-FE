import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ForgotPasswordSchema, type TResetPasswordBodyValues, type TForgotPasswordValues } from '@/models/auth.model';
import { Link, useFetcher, useNavigate } from 'react-router';
import { VerificationType } from '@/contants/type';
import { toast } from 'react-toastify';

export default function ForgotPasswordForm() {
  const sendCodeFetcher = useFetcher();
  const resetFetcher = useFetcher();

  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0); // seconds
  const [codeSentEmail, setCodeSentEmail] = useState<string | null>(null);
  const lastEmailRef = useRef('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues,
    watch
  } = useForm<TForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '', newPassword: '', confirmNewPassword: '', code: '' }
  });

  const emailValue = watch('email');

  const onSubmit = handleSubmit(async (values) => {
    const payload: TResetPasswordBodyValues = {
      email: values.email,
      newPassword: values.newPassword,
      code: values.code
    };

    resetFetcher.submit(payload, { method: 'post', action: '/auth/forgot-password' });
  });

  const handleSendCode = () => {
    const email = getValues('email');

    if (!email) {
      setError('email', { type: 'manual', message: 'Email is required to send code' });
      return;
    }

    clearErrors('email');

    sendCodeFetcher.submit(
      { email, type: VerificationType.forgotPassword },
      { method: 'post', action: '/auth/send-verification-code' }
    );
  };

  // Handle send-code response
  useEffect(() => {
    const data = sendCodeFetcher.data as
      | { isSuccess?: boolean; error?: string; value?: { message?: string } }
      | undefined;

    if (sendCodeFetcher.state === 'idle' && data) {
      if (data.isSuccess === true || !data.error) {
        const message = data.value?.message || 'Verification code sent successfully';
        toast.success(message);
        setCountdown(300);
        const sentEmail = getValues('email')?.trim();
        setCodeSentEmail(sentEmail || null);
      } else if (data.error) {
        toast.error(data.error);
        setCodeSentEmail(null);
        setCountdown(0);
      }
    }
  }, [sendCodeFetcher.state, sendCodeFetcher.data, getValues]);

  // Handle reset password response
  useEffect(() => {
    const data = resetFetcher.data as { isSuccess?: boolean; error?: string; value?: { message?: string } } | undefined;

    if (resetFetcher.state === 'idle' && data) {
      if (data.isSuccess && data.value?.message) {
        toast.success(data.value.message);
        navigate('/auth/sign-in');
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [resetFetcher.state, resetFetcher.data]);

  // Clear sent message and countdown on email change
  useEffect(() => {
    const trimmed = emailValue?.trim() ?? '';
    if (trimmed !== lastEmailRef.current) {
      setCodeSentEmail(null);
      setCountdown(0);
      lastEmailRef.current = trimmed;
    }
  }, [emailValue]);

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && codeSentEmail) {
      setCodeSentEmail(null);
    }
  }, [countdown, codeSentEmail]);

  const isSendingCode = sendCodeFetcher.state === 'submitting' || countdown > 0;
  const sendLabel = countdown > 0 ? `${countdown}s` : 'Send';
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
              disabled={isSendingCode}
            >
              {sendLabel}
            </button>
          </div>
          {errors.code && <p className='text-xs text-red-500'>{errors.code.message}</p>}
          {codeSentEmail && (
            <p className='text-xs text-green-600 mt-1'>
              We just sent you a verification code to <span className='font-medium'>{codeSentEmail}</span> Please check
              your email.
            </p>
          )}
        </div>

        <Button
          type='submit'
          size='default'
          className='w-full text-xs uppercase bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          disabled={isSubmitting || resetFetcher.state === 'submitting'}
        >
          {resetFetcher.state === 'submitting' ? 'Resetting…' : 'Reset password'}
        </Button>

        <div className='flex items-center justify-end text-xs font-normal text-[#333] gap-1'>
          <span>Remembered Password?</span>
          <Link
            to='/auth/sign-in'
            className='text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
