import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { fetchAuthMe } from '@/services/client/profile.client';
import { SESSION_FLAG_KEY, markHasSession } from '@/services/client/api.client';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const [shouldFetchUser, setShouldFetchUser] = useState(false);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const flag = localStorage.getItem(SESSION_FLAG_KEY);
      if (flag === null) {
        markHasSession(false);
        setShouldFetchUser(false);
      } else {
        setShouldFetchUser(flag === 'true');
      }
    }
  }, []);

  const { data, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    enabled: shouldFetchUser,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (data?.isSuccess) {
      setUser(data.value);
    } else if ((data && !data.isSuccess) || error) {
      markHasSession(false);
      clearUser();
      setShouldFetchUser(false);
    }
  }, [data, setUser, clearUser]);

  return children as React.ReactNode;
}

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <GoogleOAuthProvider clientId={envConfig.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        {mounted && <AuthInitializer>{children}</AuthInitializer>}
        {mounted && (
          <ToastContainer
            position='top-right'
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme='light'
          />
        )}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
