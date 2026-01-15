import { useState, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { fetchAuthMe } from '@/services/client/profile.client';
import { markHasSession } from '@/services/client/api.client';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const user = useUserStore((s) => s.user);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  // Chỉ fetch khi:
  // 1. Store đã hydrate từ localStorage
  // 2. Có user trong store (đã login trước đó)
  const shouldFetch = isHydrated && user !== null;

  const { data, error, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    enabled: shouldFetch,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Sync fresh data từ BE vào store
  useEffect(() => {
    if (data) {
      setUser(data.value);
    }
  }, [data, setUser]);

  // Nếu fetch fail (401, token hết hạn) → clear store
  useEffect(() => {
    if (isError) {
      clearUser();
      markHasSession(false);
    }
  }, [isError, clearUser]);

  return <>{children}</>;
}

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <GoogleOAuthProvider clientId={envConfig.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
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
