import { useState, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { useLocation, useNavigate } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const clearUser = useUserStore((s) => s.clearUser);

  const isProtectedRoute = location.pathname.startsWith('/user') || location.pathname.startsWith('/admin');

  // Chỉ check server session
  const { data: sessionData, isError } = useQuery({
    queryKey: ['session-check'],
    queryFn: async () => {
      const res = await fetch('/api/session-check', { credentials: 'include' });
      return res.json();
    },
    enabled: isHydrated,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Nếu server không có session nhưng client có user → clear + redirect (nếu cần)
  useEffect(() => {
    if (isHydrated && sessionData && sessionData.hasSession === false && user) {
      clearUser();
      if (isProtectedRoute) navigate('/auth/sign-in', { replace: true });
    }
  }, [sessionData, user, clearUser, navigate, isHydrated, isProtectedRoute]);

  useEffect(() => {
    if (isError && isHydrated && sessionData?.hasSession === true) {
      clearUser();
      navigate('/auth/logout', { replace: true });
    }
  }, [isError, sessionData, isHydrated, clearUser, navigate]);

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
        <AuthInitializer>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthInitializer>
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
