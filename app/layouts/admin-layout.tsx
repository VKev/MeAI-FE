import { Outlet } from 'react-router';

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
