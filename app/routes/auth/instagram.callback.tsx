import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { handleInstagramCallback } from '@/services/client/instagram.client';
import { applyAutoLinkForStashedWorkspace } from '@/utils/social-workspace-autolink';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error';

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error || 'Authorization failed');
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      try {
        const response = await handleInstagramCallback({
          code,
          state: state || undefined
        });

        if (response.isSuccess) {
          const returnTo = await applyAutoLinkForStashedWorkspace();
          if (returnTo) setRedirectTo(returnTo);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(response.error?.description || 'Failed to connect Instagram');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Instagram callback error:', err);
      }
    };

    processCallback();
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    const timer = setTimeout(() => {
      navigate(redirectTo ?? '/user/social-links', { replace: true });
    }, status === 'success' ? 1500 : 3000);
    return () => clearTimeout(timer);
  }, [status, navigate, redirectTo]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-neutral-950'>
      <div className='bg-neutral-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center border border-neutral-800'>
        {status === 'loading' && (
          <>
            <Loader2 className='w-12 h-12 text-pink-500 animate-spin mx-auto mb-4' />
            <h2 className='text-lg font-semibold text-white mb-2'>Connecting Instagram...</h2>
            <p className='text-slate-400 text-sm'>Please wait while we complete the authorization.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-4' />
            <h2 className='text-lg font-semibold text-white mb-2'>Connected Successfully!</h2>
            <p className='text-slate-400 text-sm'>Redirecting to your social links...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
            <h2 className='text-lg font-semibold text-white mb-2'>Connection Failed</h2>
            <p className='text-red-400 text-sm mb-4'>{errorMessage}</p>
            <button
              onClick={() => navigate('/user/social-links', { replace: true })}
              className='px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm'
            >
              Back to Social Links
            </button>
          </>
        )}
      </div>
    </div>
  );
}
