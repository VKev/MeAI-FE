import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import NotFound from '@/routes/errors/notfound';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { Outlet, redirect, useLocation, useParams, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function WorkspaceLayout() {
  const location = useLocation();
  const { workspaceId } = useParams();
  const isFullBleedProductPage = Boolean(workspaceId) && location.pathname === `/workspace/${workspaceId}/product`;

  const user = useUserStore((s) => s.user);

  const isShowSideBar = !location.pathname.includes('/ai-generation/');

  if (!workspaceId) {
    return <NotFound />;
  }

  return (
    <div className='min-h-screen bg-zinc-950'>
      <WorkspaceHeader key={'workspace-header'} user={user} isShowSideBar={isShowSideBar} />
      <div className='flex h-[calc(100vh-4rem)]'>
        {isShowSideBar && <WorkspaceSidebar key={'workspace-sidebar'} workspaceId={workspaceId} />}

        <main className='flex-1 h-full overflow-auto'>
          {isShowSideBar ? (
            <div className={isFullBleedProductPage ? 'w-full h-full' : 'max-w-7xl mx-auto w-full h-full'}>
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
