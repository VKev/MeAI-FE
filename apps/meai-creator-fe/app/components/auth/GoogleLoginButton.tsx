import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useFetcher, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

type GoogleLoginButtonProps = {
  variant?: 'signin' | 'signup';
};

function useGoogleLoginWidth(maxWidth = 400) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      const measuredWidth = Math.floor(container.getBoundingClientRect().width);
      if (measuredWidth > 0) {
        setWidth(Math.max(200, Math.min(maxWidth, measuredWidth)));
      }
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, [maxWidth]);

  return { containerRef, width };
}

export default function GoogleLoginButton({ variant = 'signin' }: GoogleLoginButtonProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSignup = variant === 'signup';
  const ctaLabel = isSignup ? 'Sign up with Google' : 'Sign in with Google';
  const { containerRef, width } = useGoogleLoginWidth();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Failed to get Google credential');
      return;
    }

    fetcher.submit(
      { idToken: credentialResponse.credential },
      {
        method: 'post',
        action: '/auth/login-with-google'
      }
    );
  };

  const handleError = () => {
    toast.error('Google login failed');
  };

  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string; redirectPath?: string } | undefined;

    if (fetcher.state === 'idle' && data) {
      if (data.error) {
        toast.error(data.error);
      } else if (data.success && data.redirectPath) {
        toast.success(isSignup ? 'Signup successful!' : 'Signin successful!');

        // Invalidate session-check so authenticated layouts can refresh user state.
        queryClient.invalidateQueries({ queryKey: ['session-check'] });

        navigate(data.redirectPath, { replace: true });
      }
    }
  }, [fetcher.data, fetcher.state, isSignup, navigate, queryClient]);

  return (
    <div ref={containerRef} className='auth-google-shell mx-auto w-full max-w-105'>
      <div className='auth-google-visual' aria-hidden='true'>
        <span className='auth-google-mark-wrap'>
          <GoogleMark className='auth-google-mark' />
        </span>
        <span className='auth-google-label'>{ctaLabel}</span>
      </div>

      <div className='auth-google-native'>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme='filled_black'
          size='large'
          text={isSignup ? 'signup_with' : 'signin_with'}
          shape='rectangular'
          logo_alignment='left'
          width={String(width)}
        />
      </div>
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 48 48' className={className} aria-hidden='true'>
      <path
        fill='#FFC107'
        d='M43.611 20.083H42V20H24v8h11.303C33.649 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.84 1.154 7.959 3.041l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
      />
      <path
        fill='#FF3D00'
        d='M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.84 1.154 7.959 3.041l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.318 4.337-17.694 10.691z'
      />
      <path
        fill='#4CAF50'
        d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.145 35.091 26.715 36 24 36c-5.176 0-9.618-3.325-11.283-7.946l-6.522 5.025C9.53 39.556 16.227 44 24 44z'
      />
      <path
        fill='#1976D2'
        d='M43.611 20.083H42V20H24v8h11.303c-.793 2.308-2.276 4.29-4.084 5.57l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
      />
    </svg>
  );
}
