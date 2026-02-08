import { Footer } from '@/components/guest/Footer';
import { Header } from '@/components/guest/Header';
import { HeroVideoBackground } from '@/components/guest/HeroVideoBackground';
import { Outlet, useLocation } from 'react-router';

export default function GuestLayout() {
  const location = useLocation();
  const shouldShowVideoBackground = location.pathname === '/' || location.pathname === '/about' || location.pathname.startsWith('/about/');

  return (
    <div className='min-h-screen bg-[#050507]'>
      {shouldShowVideoBackground && (
        <div className='pointer-events-none fixed inset-0 z-0'>
          <HeroVideoBackground />
        </div>
      )}
      <Header />
      <div
        className={`relative z-10 flex min-h-screen flex-col ${
          shouldShowVideoBackground ? 'bg-transparent' : 'bg-[#050507]'
        }`}
      >
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
