import { hasRole, requireUser } from '@/services/server/session.server';
import { Outlet, type LoaderFunctionArgs, redirect } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, "user")) {
    throw redirect('/forbidden');
  }

  return { user };
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
