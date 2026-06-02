import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import NotFound from '@/routes/errors/notfound';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useCurrentUser } from '@/utils/user-state';
import { matchPath, Outlet, redirect, useLocation, useParams, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  if (!hasRole(sessionUser, 'user')) {
    throw redirect('/forbidden');
  }

  return null;
}

export default function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const user = useCurrentUser();

  if (!workspaceId) {
    return <NotFound />;
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#050507] text-white'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-30' />
        <div className='absolute inset-0 bg-[radial-gradient(52%_44%_at_50%_-12%,rgba(132,92,235,0.3),rgba(132,92,235,0)_72%)]' />
        <div className='absolute -left-36 top-[28%] h-72 w-72 rounded-full bg-[#7a45f3]/16 blur-[110px]' />
        <div className='absolute -right-32 top-[16%] h-80 w-80 rounded-full bg-[#df83ef]/14 blur-[120px]' />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,7,0.12)_0%,rgba(5,5,7,0.72)_72%,#050507_100%)]' />
      </div>

      <WorkspaceHeader key={'workspace-header'} user={user} />
      <div className='relative z-10 flex h-[calc(100vh-4rem)]'>
        <WorkspaceSidebar key={'workspace-sidebar'} workspaceId={workspaceId ?? ''} />
        <main className='flex-1 h-full overflow-auto'>
          <div className='max-w-7xl mx-auto w-full h-full px-6 py-8'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
