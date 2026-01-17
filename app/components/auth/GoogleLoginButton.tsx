import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useFetcher, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

export default function GoogleLoginButton() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      // Submit the ID token to our backend
      fetcher.submit(
        { idToken: credentialResponse.credential },
        {
          method: 'post',
          action: '/auth/login-with-google'
        }
      );
    } else {
      toast.error('Failed to get Google credential');
    }
  };

  const handleError = () => {
    toast.error('Google login failed');
  };

  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string; redirectPath: string } | undefined;
    if (fetcher.state === 'idle' && data) {
      if (data.error) {
        toast.error(data.error);
      } else if (data.success && data.redirectPath) {
        // Google login thành công → AppProvider sẽ tự động fetch user
        toast.success('Signin successful!');
        // Invalidate queries trước khi navigate
        queryClient.invalidateQueries({ queryKey: ['session-check'] });
        queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        // Delay nhỏ để đợi cookies được set
        setTimeout(() => {
          navigate(data.redirectPath, { replace: true });
        }, 100);
      }
    }
  }, [fetcher.data, fetcher.state, navigate, queryClient]);
  return (
    <div className='flex justify-center'>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme='filled_black'
        size='large'
        text='continue_with'
        shape='rectangular'
        width='300'
      />
    </div>
  );
}
