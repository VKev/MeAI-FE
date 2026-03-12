import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useFetcher, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { VerificationType } from '@/contants/type';
import { SignupSchema, type TSignupBodyValues, type TSignupValues } from '@/models/auth.model';

type Props = {
  isActive: boolean;
};

export default function SignupForm({ isActive }: Props) {
  const sendCodeFetcher = useFetcher();
  const signupFetcher = useFetcher();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSentEmail, setCodeSentEmail] = useState<string | null>(null);

  const lastAutoUsername = useRef('');
  const lastEmailRef = useRef('');

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = handleSubmit((values) => {
    const payload: TSignupBodyValues = {
      fullName: values.username,
      username: values.username,
      email: values.email,
      password: values.password,
      code: values.code,
      phoneNumber: ''
    };

    signupFetcher.submit(payload, {
      method: 'post',
      action: '/auth/sign-up'
    });
  });

  useEffect(() => {
    const data = signupFetcher.data as { success?: boolean; error?: string; redirectPath?: string } | undefined;

    if (signupFetcher.state === 'idle' && data) {
      if (data.error) {
        toast.error(data.error);
      } else if (data.success && data.redirectPath) {
        toast.success('Signin successful!');

        // Invalidate session-check so authenticated layouts can refresh user state.
        queryClient.invalidateQueries({ queryKey: ['session-check'] });

        navigate(data.redirectPath, { replace: true });
      }
    }
  }, [signupFetcher.state, signupFetcher.data, navigate, queryClient]);

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
    <div
      className={`absolute inset-y-0 left-0 w-full transition-all duration-500 ease-out md:w-1/2 ${
        isActive ? 'z-10 opacity-100 md:translate-x-full' : 'pointer-events-none z-0 opacity-0 md:translate-x-0'
      }`}
    >
      <div className='auth-scroll-area flex h-full flex-col items-center justify-start overflow-y-auto px-6 pb-10 pt-16 sm:px-10 sm:pt-20'>
        <div className='w-full max-w-[420px]'>
          <p className='mb-2 text-xs font-semibold tracking-[0.14em] text-white/46 uppercase'>New workspace</p>
          <h1 className='mb-2 text-3xl leading-tight font-semibold text-white sm:text-4xl'>Create your account</h1>
          <p className='mb-6 text-sm leading-6 text-white/60'>
            Start publishing and optimizing campaigns with one connected workflow.
          </p>
        </div>

        <form className='w-full max-w-[420px] space-y-3.5' onSubmit={onSubmit}>
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
            <Input
              type='text'
              placeholder='Username'
              aria-invalid={!!errors.username}
              className='h-11 rounded-xl border-white/12 bg-black/35 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
              {...register('username')}
            />
            {errors.username && <p className='text-xs text-red-500'>{errors.username.message}</p>}
          </div>

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                aria-invalid={!!errors.password}
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-10 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('password')}
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

          <div className='space-y-1'>
            <div className='relative'>
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder='Confirm password'
                aria-invalid={!!errors.confirmPassword}
                className='h-11 rounded-xl border-white/12 bg-black/35 pr-10 text-white placeholder:text-white/35 selection:bg-white/20 selection:text-white caret-white'
                {...register('confirmPassword')}
              />
              <button
                type='button'
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-white/44 hover:text-white/70 focus-visible:outline-none'
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
            className='h-11 w-full rounded-xl bg-[linear-gradient(92deg,#7b46f8_0%,#b057f4_100%)] text-xs font-semibold tracking-[0.1em] text-white uppercase transition hover:brightness-110'
            disabled={signupFetcher.state === 'submitting'}
          >
            {signupFetcher.state === 'submitting' ? 'Creating...' : 'Sign Up'}
          </Button>
        </form>

        <div className='mt-4 w-full max-w-[420px] text-center text-xs text-white/52'>
          <span>Already have an account? </span>
          <Link to='/auth/sign-in' className='font-medium text-white/82 transition-colors hover:text-white'>
            Sign in
          </Link>
        </div>

        <div className='mt-8 w-full max-w-[420px] space-y-3'>
          <div className='flex items-center gap-2 text-xs text-white/40'>
            <span className='h-px flex-1 bg-white/14' />
            <span>Or sign up with</span>
            <span className='h-px flex-1 bg-white/14' />
          </div>

          <GoogleLoginButton variant='signup' />
        </div>
      </div>
    </div>
  );
}
