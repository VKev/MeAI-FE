import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-r from-gray-200 to-blue-200 '>
      <Outlet />
    </div>
  );
}
