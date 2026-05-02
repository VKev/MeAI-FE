/**
 * User State Utilities
 * Centralized hooks for accessing and managing user state
 */

import { useUserStore } from '@/store/user.store';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';

/**
 * Get current user from Zustand store
 */
export function useCurrentUser() {
  return useUserStore((s) => s.user);
}

/**
 * Get user coin balance
 */
export function useUserCoins() {
  const user = useUserStore((s) => s.user);
  return Number(user?.meAiCoin ?? 0);
}

/**
 * Get user full name or username as fallback
 */
export function useDisplayName() {
  const user = useUserStore((s) => s.user);
  return user?.fullName || user?.username || 'User';
}

/**
 * Refetch user profile from server
 */
export function useRefetchUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me() });
}

/**
 * Update user in store directly (for optimistic updates)
 */
export function useUpdateUserStore() {
  const setUser = useUserStore((s) => s.setUser);
  return setUser;
}

/**
 * Deduct coins from user store (optimistic update)
 * Returns the new balance or null if user not found
 */
export function useOptimisticCoinDeduct(cost: number) {
  const user = useCurrentUser();
  const setUser = useUpdateUserStore();

  if (!user || cost <= 0) return null;

  const previousBalance = Number(user.meAiCoin ?? 0);
  const newBalance = Math.max(0, previousBalance - cost);

  setUser({ ...user, meAiCoin: newBalance });

  return {
    newBalance,
    previousBalance,
    appliedCost: cost,
  };
}

/**
 * Restore coin balance (for rollback on error)
 */
export function useRestoreCoinBalance(previousBalance: number) {
  const user = useCurrentUser();
  const setUser = useUpdateUserStore();

  if (!user || previousBalance === null) return;

  setUser({ ...user, meAiCoin: previousBalance });
}

/**
 * Clear user from store
 */
export function useClearUser() {
  const clearUser = useUserStore((s) => s.clearUser);
  return clearUser;
}

/**
 * Check if user is hydrated from localStorage
 */
export function useIsUserHydrated() {
  return useUserStore((s) => s.isHydrated);
}
