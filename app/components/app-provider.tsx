import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import envConfig from '@/config';

type Props = {
  children: ReactNode;
};

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <GoogleOAuthProvider clientId={envConfig.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        {children}
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
