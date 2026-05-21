import { lazy, Suspense } from 'react';
import { MobileBlocker } from './components/MobileBlocker';
import { Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/apis/profile.api';
import LoadingSpinner from '@/components/LoadingSpinner';

const EditorInterface = lazy(() =>
  import('./components/editor/EditorInterface').then((m) => ({
    default: m.EditorInterface
  }))
);

function App() {
  const isHavingUser = localStorage.getItem('user-storage') ?? false;

  const {
    data: profile,
    isFetching,
    isError
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    refetchOnWindowFocus: true,
    enabled: !!isHavingUser
  });

  if (isFetching) {
    return <LoadingSpinner message='Loading profile...' />;
  }

  if (isError || !profile) {
    return (
      <div className='h-screen w-screen bg-background flex flex-col items-center justify-center space-y-5'>
        <p className='text-sm text-text-secondary'>Error loading profile.</p>
        <Button onClick={() => (window.location.href = '/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className='h-screen w-screen bg-background text-text-primary overflow-hidden'>
      <MobileBlocker />
      <Suspense fallback={<LoadingSpinner message='Loading editor...' />}>
        <EditorInterface />
      </Suspense>
    </div>
  );
}

export default App;
