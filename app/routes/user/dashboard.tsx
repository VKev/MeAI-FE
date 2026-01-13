import { useUser } from '@/contexts/user.context';
import { useFetcher, useNavigation } from 'react-router';

export default function Dashboard() {
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const { user } = useUser();

  const onSubmit = () => {
    fetcher.submit(
      {},
      {
        method: 'post',
        action: '/auth/logout'
      }
    );
  };

  // React Router handles loading states automatically
  const isLoading = navigation.state === 'loading';

  if (isLoading) return <div>Loading...</div>;
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
