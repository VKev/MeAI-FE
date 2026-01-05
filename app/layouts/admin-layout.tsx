import { requireUser } from '@/services/session.server';
import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!user.roles.includes('admin')) {
    throw redirect('/forbidden');
  }

  return { user };
}

export default function AdminLayout() {
  return (
    <div>
      AdminLayout
      <main>
        <Outlet />
      </main>
    </div>
  );
}
