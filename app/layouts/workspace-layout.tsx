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
    <div className='min-h-screen bg-[#050507]'>
      <WorkspaceHeader key={'workspace-header'} user={user} />
      <div className='flex h-[calc(100vh-4rem)]'>
        <WorkspaceSidebar key={'workspace-sidebar'} workspaceId={workspaceId ?? ''} />
        <main className='flex-1 h-full overflow-auto'>
          <div className='max-w-7xl mx-auto w-full h-full'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
