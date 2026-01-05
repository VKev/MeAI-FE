import { requireUser } from '@/services/session.server';
import { Outlet, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  return requireUser(request);
}

export default function UserLayout() {
  return (
    <div>
      UserLayout
      <main>
        <Outlet />
      </main>
    </div>
  );
}
