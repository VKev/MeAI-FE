import Loader from '@/components/ui/loading';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import { fetchAuthMe } from '@/services/client/profile.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet, redirect, useLoaderData, useNavigate, useParams, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const { user: loaderUser } = useLoaderData<typeof loader>();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

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

  if (!user || isLoading) {
    return <Loader />;
  }

  if (isError) {
    navigate('/server-error');
    return;
  }

  return (
    <div className='min-h-screen bg-[#010305]'>
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
