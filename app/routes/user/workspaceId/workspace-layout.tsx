import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import { Outlet } from 'react-router';

export default function WorkspaceLayout() {
  return (
    <div className='min-h-screen'>
      <WorkspaceHeader />
      <div className='flex h-[calc(100vh-4rem)]'>
        <WorkspaceSidebar />

        <main className='flex-1 h-full overflow-auto'>
          <div className='max-w-7xl mx-auto w-full h-full'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
