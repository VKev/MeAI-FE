import Loader from '@/components/ui/loading';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import { fetchAuthMe } from '@/services/client/profile.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  matchRoutes,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
  type LoaderFunctionArgs
} from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();

  const { user: loaderUser } = useLoaderData<typeof loader>();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const matches = matchRoutes(
    [{ path: 'workspace/:workspaceId/image-generation' }, { path: 'workspace/:workspaceId/video-generation' }],
    location
  );
  const isShowSideBar = !matches;

  // Sync loader user to zustand store
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: fetchAuthMe,
    enabled: !!loaderUser && !user,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Sync fresh data từ BE vào store
  useEffect(() => {
    if (data?.value) {
      setUser(data.value);
    }
  }, [data, setUser]);

  // Check params validity - workspaceId
  useEffect(() => {
    if (!workspaceId) {
      navigate('/forbidden');
    }
  }, [workspaceId, navigate]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    navigate('/server-error');
    return;
  }

  return (
    <div className='min-h-screen bg-zinc-950'>
      <WorkspaceHeader key={'workspace-header'} user={user} isShowSideBar={isShowSideBar} />
      <div className='flex h-[calc(100vh-4rem)]'>
        {isShowSideBar && <WorkspaceSidebar key={'workspace-sidebar'} workspaceId={workspaceId ?? ''} />}

        <main className='flex-1 h-full overflow-auto'>
          {isShowSideBar ? (
            <div className='max-w-7xl mx-auto w-full h-full'>
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
