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
    const data = fetcher.data as { success?: boolean; error?: string; redirectPath?: string } | undefined;
    if (fetcher.state === 'idle' && data) {
      if (data.error) {
        toast.error(data.error);
      } else if (data.success && data.redirectPath) {
        toast.success('Signin successful!');

        // Chỉ cần invalidate session-check; UserLayout loader sẽ lấy user và sync vào store
        queryClient.invalidateQueries({ queryKey: ['session-check'] });

        navigate(data.redirectPath, { replace: true });
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
