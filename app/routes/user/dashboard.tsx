// import Loader from '@/components/ui/loading';
import { useCurrentUser, useUserActions } from '@/store/user-provider';
import { useFetcher } from 'react-router';

export default function Dashboard() {
  const fetcher = useFetcher();
  const user = useCurrentUser();
  const { clearUser } = useUserActions();
  
  console.log('user', user);

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

  if (!user) return <div>Not authenticated</div>;

  // return <Loader />;
  return (
    <div>
      Dashboard
      <button onClick={onSubmit} disabled={fetcher.state !== 'idle'}>
        {fetcher.state !== 'idle' ? 'Logging out...' : 'Logout'}
      </button>
      <div>
        <h1>Welcome, {user.fullName || user.username}</h1>
        <p>Email: {user.email}</p>
        <p>Coins: {user.meAiCoin}</p>
      </div>
    </div>
  );
}
