import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toast';
import { TooltipProvider } from '@/components/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
});

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <ToastContainer position='top-right' />
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
