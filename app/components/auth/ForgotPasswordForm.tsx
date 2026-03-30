import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useFetcher, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerificationType } from '@/contants/type';
import { ForgotPasswordSchema, type TResetPasswordBodyValues, type TForgotPasswordValues } from '@/models/auth.model';

export default function ForgotPasswordForm() {
  const sendCodeFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const navigate = useNavigate();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  const onSubmit = handleSubmit((values) => {
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
  }, [resetFetcher.state, resetFetcher.data, navigate]);

  useEffect(() => {
    const trimmed = emailValue?.trim() ?? '';
    if (trimmed !== lastEmailRef.current) {
      setCodeSentEmail(null);
      setCountdown(0);
      lastEmailRef.current = trimmed;
    }
  }, [emailValue]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
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
    <div className='auth-scroll-area relative max-h-[calc(100vh-160px)] w-full max-w-140 overflow-y-auto rounded-[30px] border border-white/12 bg-[#0a0d17]/74 px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-10'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(201,116,255,0.18),rgba(201,116,255,0)_35%)]' />

      <div className='relative z-10'>
        <p className='mb-2 text-xs font-semibold tracking-[0.14em] text-white/46 uppercase'>Account recovery</p>
        <h1 className='mb-2 text-3xl leading-tight font-semibold text-white sm:text-4xl'>Reset your password</h1>
        <p className='mb-6 text-sm leading-6 text-white/60'>
          Enter your email, get a verification code, and choose a new password.
        </p>

        <form className='space-y-3.5' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Input
              type='email'
              placeholder='Email'
              aria-invalid={!!errors.email}
              className='h-11 rounded-xl border-white/12 bg-black/35 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
              {...register('email')}
            />
            {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder='New password'
                aria-invalid={!!errors.newPassword}
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-10 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('newPassword')}
              />
              <button
                type='button'
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showNewPassword}
                onClick={() => setShowNewPassword((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-white/44 hover:text-white/70 focus-visible:outline-none'
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
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-10 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('confirmNewPassword')}
              />
              <button
                type='button'
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-white/44 hover:text-white/70 focus-visible:outline-none'
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
                placeholder='Verification code'
                aria-invalid={!!errors.code}
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-24 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('code')}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-none disabled:opacity-45'
                onClick={handleSendCode}
                disabled={isSendingCode}
              >
                {sendLabel}
              </button>
            </div>
            {errors.code && <p className='text-xs text-red-500'>{errors.code.message}</p>}
            {codeSentEmail && (
              <p className='mt-1 text-xs text-emerald-300/95'>
                We sent a verification code to <span className='font-medium'>{codeSentEmail}</span>.
              </p>
            )}
          </div>

          <Button
            type='submit'
            size='default'
            className='h-11 w-full rounded-xl bg-[linear-gradient(92deg,#7b46f8_0%,#b057f4_100%)] text-xs font-semibold tracking-widest text-white uppercase transition hover:brightness-110'
            disabled={isSubmitting || resetFetcher.state === 'submitting'}
          >
            {resetFetcher.state === 'submitting' ? 'Resetting...' : 'Reset password'}
          </Button>

          <div className='flex items-center justify-end gap-1 text-xs text-white/50'>
            <span>Remembered your password?</span>
            <Link to='/auth/sign-in' className='font-medium text-white/82 transition-colors hover:text-white'>
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
