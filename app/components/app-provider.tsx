import { useState, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { fetchAuthMe } from '@/services/client/profile.client';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { useLocation, useNavigate } from 'react-router';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  const isProtectedRoute = location.pathname.startsWith('/user') || location.pathname.startsWith('/admin');

  // Query để check session từ server
  const { data: sessionData } = useQuery({
    queryKey: ['session-check'],
    queryFn: async () => {
      const res = await fetch('/api/session-check', { credentials: 'include' });
      return res.json();
    },
    enabled: isHydrated,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Fetch auth-me nếu:
  // 1. Server có session (hasSession = true)
  // 2. User đã có trong store nhưng chưa check session xong (sessionData undefined)
  const shouldFetch = isHydrated && sessionData?.hasSession === true;
  
  const { data, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: fetchAuthMe,
    enabled: shouldFetch,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Sync fresh data từ BE vào store
  useEffect(() => {
    if (data?.value) {
      setUser(data.value);
    }
  }, [data, setUser]);

  // Nếu server không có session nhưng client có user → logout
  useEffect(() => {
    if (isHydrated && sessionData && sessionData.hasSession === false && user) {
      clearUser();
      // Chỉ redirect nếu đang ở protected route
      if (isProtectedRoute) {
        navigate('/auth/sign-in', { replace: true });
      }
    }
  }, [sessionData, user, clearUser, navigate, isHydrated, isProtectedRoute]);

  // Nếu fetch fail (401, token hết hạn) → clear store + redirect
  useEffect(() => {
    if (isError && shouldFetch) {
      clearUser();
      navigate('/auth/logout', { replace: true });
    }
  }, [isError, shouldFetch, clearUser, navigate]);

  return <>{children}</>;
}

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
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
