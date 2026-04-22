import { useState, useEffect, useRef, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { Toaster as SonnerToaster } from 'sonner';
import envConfig from '@/config';
import { useUserStore } from '@/store/user.store';
import { Navigate, useLocation } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fetchAuthMe } from '@/services/client/profile.client';
import { useNotificationHub } from '@/hooks/useNotificationHub';

type Props = {
  children: ReactNode;
};

function AuthInitializer({ children }: Props) {
  const location = useLocation();
  const queryClient = useQueryClient();

  const setUser = useUserStore((s) => s.setUser);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const clearUser = useUserStore((s) => s.clearUser);
  const storedUserId = useUserStore((s) => s.user?.id ?? null);

  // Wipe React Query cache on genuine identity changes — logout (X → null) and A → B
  // switches — so shared keys like ['auth-me'] / ['user-products'] don't leak the
  // previous account's data.
  //
  // We deliberately SKIP `null/undefined → X` transitions: that's either the Zustand
  // persist rehydration finishing or a fresh login after a clean logout. Clearing there
  // would nuke the queries the current mount already fetched (e.g. ['post-builder', id]
  // on a SPA nav from /workspace/:ws/product) and leave the page blank until reload.
  const lastSeenUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const lastSeen = lastSeenUserIdRef.current;
    if (lastSeen === undefined) {
      lastSeenUserIdRef.current = storedUserId;
      return;
    }
    if (lastSeen !== null && lastSeen !== storedUserId) {
      queryClient.clear();
    }
    lastSeenUserIdRef.current = storedUserId;
  }, [storedUserId, queryClient]);

  // Workspace routes (including top-level `/workspace/:ws/post-builder/:id`) need the same
  // profile hydration as `/user` / `/admin` — the coin badge + gated features depend on
  // `useUserStore(s => s.user)` being populated via the `auth-me` query below.
  const isProtectedRoute =
    location.pathname.startsWith('/user') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/workspace');
  const isLoggedInRoute = isProtectedRoute;
  const isAuthPage = location.pathname.startsWith('/auth');

  // Connect SignalR for real-time notifications on all authenticated routes
  useNotificationHub(isLoggedInRoute && isHydrated);

  // Chỉ check server session
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session-check'],
    queryFn: async () => {
      const res = await fetch('/api/session-check', { credentials: 'include' });
      return res.json();
    },
    enabled: isHydrated && isProtectedRoute,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false
  });

  const { data: userData, isError: isAuthMeError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => fetchAuthMe(),
    enabled: sessionData?.hasSession === true && isProtectedRoute,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false
  });

  const shouldLogout =
    isProtectedRoute && isHydrated && !isLoading && (sessionData?.hasSession === false || isAuthMeError);

  useEffect(() => {
    if (userData?.value) {
      setUser(userData.value);
    }
  }, [setUser, userData]);

  if (shouldLogout && !isAuthPage) {
    // Session died server-side — clear both the cache and the user store so the next
    // sign-in doesn't start with any stale queries.
    queryClient.clear();
    clearUser();
    return <Navigate to='/auth/sign-in' replace />;
  }

  return <>{children}</>;
}

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
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
          <>
            <ToastContainer
              position='top-right'
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme='dark'
            />
            <SonnerToaster position='top-right' theme='dark' richColors closeButton />
          </>
        )}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
