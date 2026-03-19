import { useState, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { Navigate, useLocation } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fetchAuthMe } from '@/services/client/profile.client';
import Loader from '@/components/ui/loading';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const location = useLocation();

  const setUser = useUserStore((s) => s.setUser);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const clearUser = useUserStore((s) => s.clearUser);

  const isProtectedRoute = location.pathname.startsWith('/user') || location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname.startsWith('/auth');

  // Chỉ check server session
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session-check'],
    queryFn: async () => {
      const res = await fetch('/api/session-check', { credentials: 'include' });
      return res.json();
    },
    enabled: isHydrated,
    retry: false,
    refetchOnWindowFocus: false
  });

  const { data: userData, isError: isAuthMeError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => fetchAuthMe(),
    enabled: sessionData?.hasSession === true && isProtectedRoute,
    retry: false,
    refetchOnWindowFocus: false
  });

  const shouldLogout = isProtectedRoute && !isLoading && (sessionData?.hasSession === false || isAuthMeError);

  useEffect(() => {
    if (userData?.value) {
      setUser(userData.value);
    }
  }, [userData]);

  if (shouldLogout && !isAuthPage) {
    clearUser();
    return <Navigate to='/auth/sign-in' replace />;
  }

  if (isLoading) {
    return <Loader />;
  }

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
          <Toaster
            position='top-right'
            theme='dark'
            richColors
            closeButton
            duration={3000}
            toastOptions={{
              style: {
                background: 'rgba(19, 19, 30, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                padding: '12px 16px',
                gap: '10px'
              }
            }}
          />
        )}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
