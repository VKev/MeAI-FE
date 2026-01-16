import UserFloatingSidebar from '@/components/user/UserFloatingSidebar';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { useEffect } from 'react';
import { Outlet, type LoaderFunctionArgs, redirect, useFetcher } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function UserLayout() {
  const fetcher = useFetcher();
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);

  const onSubmit = () => {
    clearUser();
    fetcher.submit(
      {},
      {
        method: 'post',
        action: '/auth/logout'
      }
    );
  };


  return (
    <div className='min-h-screen'>
      <UserFloatingSidebar />
      <main className='ml-0 md:ml-60 p-4'>
        <Outlet />
      </main>
    </div>
  );
}
