import { useEffect, useCallback, lazy, Suspense } from 'react';
import { MobileBlocker } from './components/MobileBlocker';
import { useUIStore } from './stores/ui-store';
import { useRouter } from './hooks/use-router';
import { TooltipProvider } from '@meai-editor/ui';

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
  const { openModal: openSearchModal } = useUIStore();

  const { route, navigate } = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && route !== 'editor') {
        navigate('editor');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal('search');
      }
    },
    [route, navigate, openSearchModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TooltipProvider>
      <div className='h-screen w-screen bg-background text-text-primary overflow-hidden'>
        <MobileBlocker />
        <Suspense fallback={<LoadingSpinner message='Loading editor...' />}>
          <EditorInterface />
        </Suspense>
      </div>
    </TooltipProvider>
  );
}

export default App;
