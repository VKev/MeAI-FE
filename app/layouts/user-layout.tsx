import { Outlet } from 'react-router';

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
