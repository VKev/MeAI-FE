import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useFetcher, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { markHasSession } from '@/services/client/api.client';
import { useUserStore } from '@/store/user.store';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthMe } from '@/services/client/profile.client';

export default function GoogleLoginButton() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const [shouldFetchUser, setShouldFetchUser] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Auto-fetch user sau khi Google login thành công
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me', 'google'],
    queryFn: fetchAuthMe,
    enabled: shouldFetchUser,
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (userData && redirectPath) {
      setUser(userData.value);
      toast.success('Signin successful!');
      // Small delay để đảm bảo store đã update
      setTimeout(() => {
        navigate(redirectPath);
      }, 100);
    }
  }, [userData, redirectPath, setUser, navigate]);

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
      markHasSession(false);
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
        markHasSession(false);
        setShouldFetchUser(false);
        setRedirectPath(null);
      } else if (data.success && data.redirectPath) {
        // Google login thành công → trigger fetch user
        markHasSession(true);
        setRedirectPath(data.redirectPath);
        setShouldFetchUser(true);
      }
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
