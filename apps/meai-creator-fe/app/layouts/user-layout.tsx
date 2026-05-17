import UserFloatingSidebar from '@/components/user/UserFloatingSidebar';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { Outlet, type LoaderFunctionArgs, redirect, useFetcher } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/utils/user-state';

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  if (!hasRole(sessionUser, 'user')) {
    throw redirect('/forbidden');
  }

  return null;
}

export default function UserLayout() {
  const fetcher = useFetcher();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  const clearUser = useUserStore((s) => s.clearUser);

  const logout = () => {
    // Wipe the React Query cache so the next signed-in user doesn't see the previous
    // account's profile / dashboard / product data through shared query keys like
    // ['auth-me'] / ['user-products'] / ['post-builders', 'all'] that aren't scoped by userId.
    queryClient.clear();
    clearUser();
    fetcher.submit(null, {
      method: 'post',
      action: '/auth/logout'
    });
  };

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
      <main className='relative z-10 ml-26.5'>
        <div className={'mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
