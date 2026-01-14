import useUserStore from '@/store/user.store';
import { useFetcher } from 'react-router';

export default function Dashboard() {
  const fetcher = useFetcher();
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);

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
