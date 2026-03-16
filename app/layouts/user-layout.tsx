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
  useLocation,
  useNavigate
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

  // const matches = matchRoutes([{ path: 'user/workspace/:workspaceId' }], location);
  // const isShowSideBar = !matches;

  const { user: loaderUser } = useLoaderData<typeof loader>();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const isFullBleedProductPage = location.pathname === '/user/product';

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

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    navigate('/server-error');
    return;
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

      <UserFloatingSidebar key={'Sidebar'} user={user} logout={logout} />
      <main className='relative z-10 ml-[106px]'>
        <div
          className={
            isFullBleedProductPage ? 'w-full px-0 py-5 md:py-8' : 'mx-auto max-w-[1200px] px-4 py-5 md:px-8 md:py-8'
          }
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
