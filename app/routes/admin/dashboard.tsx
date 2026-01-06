import { useFetcher } from 'react-router';

export default function Dashboard() {
  const fetcher = useFetcher();

  const onSubmit = () => {
    fetcher.submit(
      {},
      {
        method: 'post',
        action: '/auth/logout'
      }
    );
  };
  return (
    <>
      <div>Dashboard</div>
      <button onClick={onSubmit}>Logout</button>
    </>
  );
}
