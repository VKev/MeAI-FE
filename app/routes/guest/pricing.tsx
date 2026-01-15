import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionsClient } from '@/services/client/subscription.client';

export default function Pricing() {
  // client side fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptionsClient
  });

  useEffect(() => {
    if (data) console.log('Client subscriptions:', data);
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <div>Pricing</div>;
}
