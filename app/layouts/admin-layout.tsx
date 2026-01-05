import { requireUser } from '@/services/session.server';
import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  return requireUser(request);
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
