/**
 * Coin Client Service
 * All coin-related client operations
 */

import { useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';

/**
 * Refetch user profile (to sync coin balance from server)
 */
export function useRefetchAuthMeProfile() {
  const queryClient = useQueryClient();
  return () => {
    return queryClient.refetchQueries({
      queryKey: AUTH_QUERY_KEYS.me(),
    });
  };
}

/**
 * Invalidate user profile cache (triggers refetch)
 */
export function useInvalidateAuthMeProfile() {
  const queryClient = useQueryClient();
  return () => {
    return queryClient.invalidateQueries({
      queryKey: AUTH_QUERY_KEYS.me(),
    });
  };
}

/**
 * Async version - refetch auth/me profile
 * Use this in server-side contexts if needed
 */
export async function refetchAuthMeProfileAsync(queryClient: any) {
  return queryClient.refetchQueries({
    queryKey: AUTH_QUERY_KEYS.me(),
  });
}
