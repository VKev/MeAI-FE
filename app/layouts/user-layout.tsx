import UserFloatingSidebar from '@/components/user/UserFloatingSidebar';
import { hasRole, requireUser } from '@/services/server/session.server';
import { useUserStore } from '@/store/user.store';
import { Outlet, type LoaderFunctionArgs, redirect, useFetcher } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'user')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function UserLayout() {
  return (
    <div className='min-h-screen bg-gray-600'>
      <UserFloatingSidebar key={'Sidebar'} />
      <main className='ml-0 md:ml-60 p-4'>
        <Outlet />
      </main>
    </div>
  );
}
