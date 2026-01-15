import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignupSchema, type TSignupBodyValues, type TSignupValues } from '@/models/auth.model';
import { VerificationType } from '@/contants/type';
import { toast } from 'react-toastify';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { markHasSession } from '@/services/client/api.client';

type Props = {
  isActive: boolean;
};

export default function SignupForm({ isActive }: Props) {
  const sendCodeFetcher = useFetcher();
  const signupFetcher = useFetcher();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0); // seconds
  const [codeSentEmail, setCodeSentEmail] = useState<string | null>(null);
  const lastAutoUsername = useRef('');
  const lastEmailRef = useRef('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues,
    setValue,
    watch
  } = useForm<TSignupValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', code: '' }
  });

  const emailValue = watch('email');

  useEffect(() => {
    const currentEmail = emailValue?.trim();
    const currentUsername = getValues('username');

    if (!currentEmail) {
      if (currentUsername === lastAutoUsername.current) {
        setValue('username', '', { shouldDirty: true });
        lastAutoUsername.current = '';
      }
      return;
    }

    const derivedUsername = currentEmail.split('@')[0] ?? '';
    if (!derivedUsername) return;

    if (!currentUsername || currentUsername === lastAutoUsername.current) {
      setValue('username', derivedUsername, { shouldDirty: true });
      lastAutoUsername.current = derivedUsername;
    }
  }, [emailValue, getValues, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: TSignupBodyValues = {
      fullName: values.username,
      username: values.username,
      email: values.email,
      password: values.password,
      code: values.code,
      phoneNumber: ''
    };

    markHasSession(true);
    signupFetcher.submit(payload, {
      method: 'post',
      action: '/auth/sign-up'
    });
  });

  // show toast
  useEffect(() => {
    const data = signupFetcher.data as
      | { isSuccess?: boolean; error?: string; value?: { message?: string } }
      | undefined;
    if (signupFetcher.state === 'idle' && data) {
      // If API follows isSuccess flag or no error prop
      if (data.error) {
        toast.error(data.error);
        markHasSession(false);
      }
    }
  }, [signupFetcher.state, signupFetcher.data]);

  const handleSendCode = () => {
    const email = getValues('email');

    if (!email) {
      setError('email', { type: 'manual', message: 'Email is required to send code' });
      return;
    }

    clearErrors('email');

    sendCodeFetcher.submit(
      { email, type: VerificationType.register },
      { method: 'post', action: '/auth/send-verification-code' }
    );
  };

  // Start countdown when send code success + show toast
  useEffect(() => {
    const data = sendCodeFetcher.data as
      | { isSuccess?: boolean; error?: string; value?: { message?: string } }
      | undefined;

    if (sendCodeFetcher.state === 'idle' && data) {
      // If API follows isSuccess flag or no error prop
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

  // Clear sent message and countdown on any email change
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
    <div
      className={`absolute top-0 h-full w-1/2 left-0 transition-all duration-600 ease-in-out ${
        isActive ? 'translate-x-full opacity-100 z-5' : 'translate-x-0 opacity-0 z-1 invisible'
      }`}
    >
      <div className='flex items-center justify-center flex-col px-10 h-full'>
        <h1 className='text-3xl font-bold mb-6 text-white'>Create account</h1>
        <form className='w-full space-y-3' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Input type='email' placeholder='Email' aria-invalid={!!errors.email} className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white' {...register('email')} />
            {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
          </div>

          <div className='space-y-1'>
            <Input type='text' placeholder='Username' aria-invalid={!!errors.username} className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white' {...register('username')} />
            {errors.username && <p className='text-xs text-red-500'>{errors.username.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                aria-invalid={!!errors.password}
                className='pr-10 text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                {...register('password')}
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

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder='Confirm password'
                aria-invalid={!!errors.confirmPassword}
                className='pr-10 text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                {...register('confirmPassword')}
              />
              <button
                type='button'
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
              >
                {showConfirm ? (
                  <EyeOff className='size-5' strokeWidth={1.5} />
                ) : (
                  <Eye className='size-5' strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className='text-xs text-red-500'>{errors.confirmPassword.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type='text'
                placeholder='Code'
                aria-invalid={!!errors.code}
                className='pr-24 text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
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
                We just sent you a verification code to <span className='font-medium'>{codeSentEmail}</span> Please
                check your email.
              </p>
            )}
          </div>

          <Button
            type='submit'
            size='default'
            className='w-full text-xs uppercase bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            disabled={isSubmitting || signupFetcher.state === 'submitting'}
          >
            {signupFetcher.state === 'submitting' ? 'Creating…' : 'Sign Up'}
          </Button>
        </form>

        <div className='w-full mt-8 space-y-3'>
          <div className='flex items-center gap-2 text-xs text-gray-400'>
            <span className='h-px flex-1 bg-gray-600' />
            <span>Or sign up with</span>
            <span className='h-px flex-1 bg-gray-600' />
          </div>

          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
