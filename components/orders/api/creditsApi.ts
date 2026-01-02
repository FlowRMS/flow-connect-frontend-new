/**
 * Credits API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Import everything for local use in hooks
import {
  fetchCreditById as _fetchCreditById,
  searchCredits as _searchCredits,
  fetchCreditsByOrder as _fetchCreditsByOrder,
  createCredit as _createCredit,
  updateCredit as _updateCredit,
  deleteCredit as _deleteCredit,
  type Credit,
  type CreateCreditInput,
  type UpdateCreditInput,
  type CreditSearchOptions,
} from '../../lib/graphql/credits';

// Re-export everything from the centralized credits module
export {
  fetchCreditById,
  searchCredits,
  fetchCreditsByOrder,
  createCredit,
  updateCredit,
  deleteCredit,
  type Credit,
  type CreditLandingPage,
  type CreditBalance,
  type CreditUser,
  type CreditOutsideSplitRate,
  type CreditDetail,
  type CreditOrder,
  type CreditType,
  type CreditCreationType,
  type CreditStatus,
  type CreditSearchResult,
  type CreateCreditInput,
  type UpdateCreditInput,
  type CreditDetailInput,
  type CreditOutsideSplitRateInput,
  type CreditSearchOptions,
  type FindLandingPagesResponse,
} from '../../lib/graphql/credits';

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch a single credit
 */
export function useCredit(creditId: string | null) {
  return useQuery({
    queryKey: ['credit', creditId],
    queryFn: () => (creditId ? _fetchCreditById(creditId) : null),
    enabled: !!creditId,
  });
}

/**
 * Hook to fetch credits for an order
 */
export function useOrderCredits(orderId: string | null) {
  return useQuery({
    queryKey: ['orderCredits', orderId],
    queryFn: () => (orderId ? _fetchCreditsByOrder(orderId) : []),
    enabled: !!orderId,
  });
}

/**
 * Hook to search credits
 */
export function useCreditSearch(
  searchTerm: string,
  limit: number = 50,
  options?: CreditSearchOptions
) {
  return useQuery({
    queryKey: ['creditSearch', searchTerm, limit, options],
    queryFn: () => _searchCredits(searchTerm, limit, options),
  });
}

/**
 * Hook to search credits for checks page (openOnly and unlockedOnly = true)
 */
export function useCreditSearchForChecks(searchTerm: string, limit: number = 50) {
  return useCreditSearch(searchTerm, limit, { openOnly: true, unlockedOnly: true });
}

/**
 * Hook to create a credit
 */
export function useCreateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCreditInput) => _createCredit(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orderCredits', data.orderId] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}

/**
 * Hook to update a credit
 */
export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCreditInput) => _updateCredit(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['credit', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orderCredits', data.orderId] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}

/**
 * Hook to delete a credit
 */
export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => _deleteCredit(id),
    onSuccess: () => {
      // Invalidate all credit queries
      queryClient.invalidateQueries({ queryKey: ['orderCredits'] });
      queryClient.invalidateQueries({ queryKey: ['creditSearch'] });
    },
  });
}
