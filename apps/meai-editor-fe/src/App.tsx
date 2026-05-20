import { lazy, Suspense, useEffect, useState } from 'react';
import { MobileBlocker } from './components/MobileBlocker';
import { Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/apis/profile.api';
import LoadingSpinner from '@/components/LoadingSpinner';
import DialogError from '@/components/DialogError';

const EditorInterface = lazy(() =>
  import('./components/editor/EditorInterface').then((m) => ({
    default: m.EditorInterface
  }))
);

function App() {
  const [isShowErrorDialog, setIsShowErrorDialog] = useState(false);

  const { data: profile, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    refetchOnWindowFocus: true
  });

  if (isError) {
    return (
      <div className='h-screen w-screen bg-background flex flex-col items-center justify-center space-y-5'>
        <p className='text-sm text-text-secondary'>Error loading profile.</p>
        <Button onClick={() => (window.location.href = '/')}>Back to Home</Button>
      </div>
    );
  }

  useEffect(() => {
    if (profile && profile.meAiCoin === 0) {
      setIsShowErrorDialog(true);
      return;
    }
  }, [profile]);

  return (
    <div className='h-screen w-screen bg-background text-text-primary overflow-hidden'>
      <MobileBlocker />
      <Suspense fallback={<LoadingSpinner message='Loading editor...' />}>
        <EditorInterface />
      </Suspense>

      {isShowErrorDialog && <DialogError isOpen={isShowErrorDialog} />}
    </div>
  );
}

export default App;
