import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toast';
import { TooltipProvider } from '@/components/ui';
import { queryClient } from '@/lib/query-client';

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <ToastContainer position='top-right' />
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
