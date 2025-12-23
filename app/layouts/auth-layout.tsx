import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div>
      auth-layout
      <main>
        <Outlet />
      </main>
    </div>
  );
}
