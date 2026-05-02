import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import { fetchAuthProfile } from '@/services/server/profile.server';
import NotFound from '@/routes/errors/notfound';
import { hasRole, requireUser } from '@/services/server/session.server';
import { data, Outlet, redirect, useLoaderData, useParams, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  if (!hasRole(sessionUser, 'user')) {
    throw redirect('/forbidden');
  }

  const { profile, headers } = await fetchAuthProfile(request);
  return data({ user: profile.value }, { headers });
}

export default function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const { user } = useLoaderData<typeof loader>();

  if (!workspaceId) {
    return <NotFound />;
  }

  return (
    <div className='min-h-screen bg-zinc-950'>
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
