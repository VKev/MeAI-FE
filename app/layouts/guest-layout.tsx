import { Footer } from '@/components/guest/Footer';
import { Header } from '@/components/guest/Header';
import { useUser } from '@/contexts/user.context';
import { Outlet } from 'react-router';

export default function GuestLayout() {
  const { user } = useUser();
  console.log("🚀 ~ GuestLayout ~ user:", user)

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
