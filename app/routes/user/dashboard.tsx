// import Loader from '@/components/ui/loading';
import { useUserStore } from '@/store/user.store';
import { useFetcher } from 'react-router';

export default function Dashboard() {
  const fetcher = useFetcher();
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);

  // console.log('user', user);

  const onSubmit = () => {
    clearUser();
    fetcher.submit(
      {},
      {
        method: 'post',
        action: '/auth/logout'
      }
    );
  };

  if (!user) return null;

  // return <Loader />;
  return (
    <div className='text-white bg-gray-700'>
      Dashboard
      <button onClick={onSubmit} disabled={fetcher.state !== 'idle'}>
        {fetcher.state !== 'idle' ? 'Logging out...' : 'Logout ở đây'}
      </button>
      {/* <div className='text-white'>
        <h1>Welcome, {user?.fullName || user?.username}</h1>
        <p>Email: {user?.email}</p>
        <p>Coins: {user?.meAiCoin}</p>
      </div> */}
    </div>
  );
}
