import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import store from '@/redux/store'
import { TooltipProvider } from '@/components/ui/tooltip.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import envConfig from '@/config.ts'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from 'next-themes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      refetchOnWindowFocus: false,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={envConfig.GOOGLE_CLIENT_ID} locale='en'>
    <Provider store={store}>
      <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <Toaster richColors position='top-right' duration={3000} />
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </GoogleOAuthProvider>
)
