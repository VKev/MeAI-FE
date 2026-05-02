/**
 * useOptimisticCoinDebit Hook
 * Reusable hook for optimistic coin deductions with rollback support
 *
 * Usage:
 * const { onMutate, onSuccess, onError } = useOptimisticCoinDebit();
 *
 * const mutation = useMutation({
 *   mutationFn: (payload) => apiCall(payload),
 *   onMutate: (variables) => onMutate(costQuote?.totalCoins ?? 0),
 *   onSuccess,
 *   onError: (error, variables, context) => onError(context)
 * });
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useUpdateUserStore, useRestoreCoinBalance } from '@/utils/user-state';
import { AUTH_QUERY_KEYS } from '@/lib/query-keys';

export type CoinDebitContext = {
  previousBalance: number;
  appliedCost: number;
} | null;

export function useOptimisticCoinDebit() {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const setUser = useUpdateUserStore();

  /**
   * Phase 1: Optimistic Update
   * Immediately deduct coins from Zustand store for instant UI feedback
   */
  const onMutate = (cost: number): CoinDebitContext => {
    if (!currentUser || cost <= 0) return null;

    const previousBalance = Number(currentUser.meAiCoin ?? 0);

    // Optimistic debit: update store immediately
    setUser({
      ...currentUser,
      meAiCoin: Math.max(0, previousBalance - cost),
    });

    return {
      previousBalance,
      appliedCost: cost,
    };
  };

  /**
   * Phase 2: Success
   * Refetch user profile from server to reconcile actual balance
   */
  const onSuccess = () => {
    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({
      queryKey: AUTH_QUERY_KEYS.me(),
    });
  };

  /**
   * Phase 3: Error
   * Rollback coin balance to previous state if operation failed
   */
  const onError = (context: CoinDebitContext | unknown) => {
    if (!context || typeof context !== 'object') return;

    const ctx = context as CoinDebitContext;
    if (ctx && ctx.previousBalance !== null && currentUser) {
      // Restore previous balance
      setUser({
        ...currentUser,
        meAiCoin: ctx.previousBalance,
      });
    }
  };

  return {
    onMutate,
    onSuccess,
    onError,
  };
}

/**
 * Alternative hook for checking if we have enough coins before mutation
 */
export function useCheckCoinBalance(requiredCost: number) {
  const currentBalance = Number(useCurrentUser()?.meAiCoin ?? 0);
  return currentBalance >= requiredCost;
}

/**
 * Helper hook to create mutation options with coin debit logic
 * Useful if you want to abstract the pattern further
 */
export function useCoinDebitMutationOptions() {
  const { onMutate, onSuccess, onError } = useOptimisticCoinDebit();

  return {
    mutationOptions: {
      onMutate,
      onSuccess,
      onError,
    },
    hooks: {
      useCheckCoinBalance,
      useOptimisticCoinDebit,
    },
  };
}
