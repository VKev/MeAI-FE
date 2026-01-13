import type { TProfile } from '@/models/profile.model';
import { useRouteLoaderData } from 'react-router';

type UserContextType = {
  user: TProfile | null;
};

/**
 * Hook to access user data from React Router's root loader.
 * This uses React Router's built-in data loading instead of custom context.
 * 
 * Usage:
 * const { user } = useUser();
 * 
 * To refetch user data:
 * const { revalidate } = useRevalidator();
 * revalidate(); // This will re-run all active loaders
 */
export function useUser() {
  const data = useRouteLoaderData<UserContextType>('root');
  // console.log("🚀 ~ useUser ~ data:", data)
  return {
    user: data?.user ?? null,
  };
}
