import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Outlet } from 'react-router';

export default function GuestLayout() {
  return (
    <div className='min-h-screen'>
      <Header />
      <div className='pt-20 flex flex-col min-h-screen'>
        <main className='flex-1'>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
