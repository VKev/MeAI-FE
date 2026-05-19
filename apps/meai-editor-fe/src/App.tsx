import { lazy, Suspense } from 'react';
import { MobileBlocker } from './components/MobileBlocker';
import { Button, TooltipProvider } from '@/components/ui';
import { ToastContainer } from 'react-toast';

const EditorInterface = lazy(() =>
  import('./components/editor/EditorInterface').then((m) => ({
    default: m.EditorInterface
  }))
);

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
  <div className='h-screen w-screen bg-background flex flex-col items-center justify-center'>
    <div className='w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3' />
    <p className='text-sm text-text-secondary'>{message}</p>
  </div>
);

function App() {
  const isHavingUser = localStorage.getItem('user-storage') ?? false;
  if (!isHavingUser) {
    // window.alert('No user found. Please log in to access the editor.');
    // window.location.href = '/';
    return (
      <div className='h-screen w-screen bg-background flex flex-col items-center justify-center space-y-5'>
        <p className='text-sm text-text-secondary'>No user found. Please log in to access the editor.</p>
        <Button onClick={() => (window.location.href = '/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='h-screen w-screen bg-background text-text-primary overflow-hidden'>
        <MobileBlocker />
        <Suspense fallback={<LoadingSpinner message='Loading editor...' />}>
          <EditorInterface />
        </Suspense>
      </div>
      <ToastContainer />
    </TooltipProvider>
  );
}

export default App;
