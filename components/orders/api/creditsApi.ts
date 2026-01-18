/**
 * Credits API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Import everything for local use in hooks
import {
  fetchCreditById as _fetchCreditById,
  searchCredits as _searchCredits,
  fetchCreditsByOrder as _fetchCreditsByOrder,
  fetchCreditsWithPagination as _fetchCreditsWithPagination,
  fetchCreditsLandingPage as _fetchCreditsLandingPage,
  createCredit as _createCredit,
  updateCredit as _updateCredit,
  deleteCredit as _deleteCredit,
  type Credit,
  type CreditLandingPage,
  type CreditSearchResult,
  type CreateCreditInput,
  type UpdateCreditInput,
  type CreditSearchOptions,
  type PaginatedCreditsResult,
} from '../../lib/graphql/credits';

// Re-export everything from the centralized credits module
export {
  fetchCreditById,
  searchCredits,
  fetchCreditsByOrder,
  fetchCreditsWithPagination,
  fetchCreditsLandingPage,
  createCredit,
  updateCredit,
  deleteCredit,
  fetchAllCreditIds,
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
  type PaginatedCreditsResult,
} from '../../lib/graphql/credits';

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

const DEFAULT_PAGE_SIZE = 50;

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
 * Hook to fetch credits (landing page)
 */
export function useCreditsLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit?: number
) {
  return useQuery({
    queryKey: ['creditsLandingPage', filters, limit],
    queryFn: () => _fetchCreditsLandingPage(filters, limit),
  });
}

/**
 * Hook to fetch credits with infinite scroll pagination
 */
export function useCreditsInfinite(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedCreditsResult, Error>({
    queryKey: ['creditsLandingPage', filters, 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return _fetchCreditsWithPagination(filters, {
        limit: pageSize,
        offset: pageParam as number,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
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
    enabled: searchTerm.length >= 2,
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
      queryClient.invalidateQueries({ queryKey: ['creditsLandingPage'] });
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
      queryClient.invalidateQueries({ queryKey: ['creditsLandingPage'] });
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
      queryClient.invalidateQueries({ queryKey: ['creditsLandingPage'] });
    },
  });
}
