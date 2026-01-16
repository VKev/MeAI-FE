import { useState, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { fetchAuthMe } from '@/services/client/profile.client';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { useLocation } from 'react-router';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const location = useLocation();
  const user = useUserStore((s) => s.user);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  // Fetch khi:
  // 1. Store đã hydrate từ localStorage
  // 2. Có user trong store (đã login trước đó) HOẶC đang ở trang protected (user/admin)
  // → Sau login, redirect về /user hoặc /admin sẽ trigger fetch
  const isProtectedRoute = location.pathname.startsWith('/user') || location.pathname.startsWith('/admin');
  const shouldFetch = isHydrated && (user !== null || isProtectedRoute);

  const { data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    enabled: shouldFetch,
    retry: false, // Không retry để tránh loop
    refetchOnWindowFocus: false,
  });

  // Sync fresh data từ BE vào store
  useEffect(() => {
    if (data?.value) {
      setUser(data.value);
    }
  }, [data, setUser]);

  // Nếu fetch fail (401, token hết hạn) → clear store
  useEffect(() => {
    if (isError && shouldFetch) {
      clearUser();
    }
  }, [isError, shouldFetch, clearUser]);

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
