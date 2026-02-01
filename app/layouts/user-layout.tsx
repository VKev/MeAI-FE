import Loader from '@/components/ui/loading';
import UserFloatingSidebar from '@/components/user/UserFloatingSidebar';
import { fetchAuthMe } from '@/services/client/profile.client';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  Outlet,
  type LoaderFunctionArgs,
  redirect,
  useFetcher,
  useLoaderData,
  useNavigate,
  useLocation,
  matchRoutes
} from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function UserLayout() {
  const fetcher = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();

  const matches = matchRoutes([{ path: 'user/workspace/:workspaceId' }], location);
  const isShowSideBar = !matches;

  const { user: loaderUser } = useLoaderData<typeof loader>();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

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

  const logout = () => {
    clearUser();
    fetcher.submit(
      {},
      {
        method: 'post',
        action: '/auth/logout'
      }
    );
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  if (isError) {
    navigate('/server-error');
    return;
  }

  return (
    <div className='min-h-screen bg-[#010305]'>
      {isShowSideBar && <UserFloatingSidebar key={'Sidebar'} user={user} logout={logout} />}
      <main className={`ml-0 ${isShowSideBar && 'md:ml-22'}`}>
        <div className={`${isShowSideBar && 'max-w-6xl mx-auto'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
