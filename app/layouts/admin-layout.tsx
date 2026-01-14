import { hasRole, requireUser } from '@/services/server/session.server';
import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, 'admin')) {
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
