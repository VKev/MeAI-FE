import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useFetcher } from 'react-router';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function GoogleLoginButton() {
  const fetcher = useFetcher();

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
    const data = fetcher.data as { error?: string } | undefined;
    if (fetcher.state === 'idle' && data?.error) {
      toast.error(data.error);
    }
  }, [fetcher.data, fetcher.state]);

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
