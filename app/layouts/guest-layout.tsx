import { Footer } from '@/components/guest/Footer';
import { Header } from '@/components/guest/Header';
import { Outlet } from 'react-router';

export default function GuestLayout() {
  return (
    <div className='min-h-screen bg-[#050507]'>
      <Header />
      <div className='flex min-h-screen flex-col bg-[#050507]'>
        <main className='flex-1'>
          <Outlet />
        </main>
        <div className='relative z-20'>
          <Footer />
        </div>
      </div>
    </div>
  );
}
