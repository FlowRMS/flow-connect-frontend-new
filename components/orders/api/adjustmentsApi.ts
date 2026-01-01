/**
 * Adjustments API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Import everything for local use in hooks
import {
  fetchAdjustmentById as _fetchAdjustmentById,
  searchAdjustments as _searchAdjustments,
  fetchAdjustmentsWithPagination as _fetchAdjustmentsWithPagination,
  fetchAdjustmentsLandingPage as _fetchAdjustmentsLandingPage,
  createAdjustment as _createAdjustment,
  updateAdjustment as _updateAdjustment,
  deleteAdjustment as _deleteAdjustment,
  type Adjustment,
  type AdjustmentLandingPage,
  type AdjustmentSearchResult,
  type CreateAdjustmentInput,
  type UpdateAdjustmentInput,
  type AdjustmentSearchOptions,
  type PaginatedAdjustmentsResult,
} from '../../lib/graphql/adjustments';

// Re-export everything from the centralized adjustments module
export {
  fetchAdjustmentById,
  searchAdjustments,
  fetchAdjustmentsWithPagination,
  fetchAdjustmentsLandingPage,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment,
  type Adjustment,
  type AdjustmentLandingPage,
  type AdjustmentUser,
  type AdjustmentSplitRate,
  type AdjustmentFactory,
  type AdjustmentCustomer,
  type AllocationMethod,
  type AdjustmentCreationType,
  type AdjustmentStatus,
  type AdjustmentSearchResult,
  type CreateAdjustmentInput,
  type UpdateAdjustmentInput,
  type AdjustmentSplitRateInput,
  type AdjustmentSearchOptions,
  type PaginatedAdjustmentsResult,
  type FindAdjustmentsLandingPagesResponse,
} from '../../lib/graphql/adjustments';

// ============================================================================
// React Query Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook to fetch a single adjustment
 */
export function useAdjustment(adjustmentId: string | null) {
  return useQuery({
    queryKey: ['adjustment', adjustmentId],
    queryFn: () => (adjustmentId ? _fetchAdjustmentById(adjustmentId) : null),
    enabled: !!adjustmentId,
  });
}

/**
 * Hook to fetch adjustments (landing page)
 */
export function useAdjustmentsLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit?: number
) {
  return useQuery({
    queryKey: ['adjustmentsLandingPage', filters, limit],
    queryFn: () => _fetchAdjustmentsLandingPage(filters, limit),
  });
}

/**
 * Hook to fetch adjustments with infinite scroll pagination
 */
export function useAdjustmentsInfinite(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedAdjustmentsResult, Error>({
    queryKey: ['adjustmentsLandingPage', filters, 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return _fetchAdjustmentsWithPagination(filters, {
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
 * Hook to search adjustments
 */
export function useAdjustmentSearch(
  searchTerm: string,
  limit: number = 50,
  options?: AdjustmentSearchOptions
) {
  return useQuery({
    queryKey: ['adjustmentSearch', searchTerm, limit, options],
    queryFn: () => _searchAdjustments(searchTerm, limit, options),
  });
}

/**
 * Hook to search adjustments for checks page (openOnly and unlockedOnly = true)
 */
export function useAdjustmentSearchForChecks(searchTerm: string, limit: number = 50) {
  return useAdjustmentSearch(searchTerm, limit, { openOnly: true, unlockedOnly: true });
}

/**
 * Hook to create an adjustment
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdjustmentInput) => _createAdjustment(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}

/**
 * Hook to update an adjustment
 */
export function useUpdateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdjustmentInput) => _updateAdjustment(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adjustment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}

/**
 * Hook to delete an adjustment
 */
export function useDeleteAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => _deleteAdjustment(id),
    onSuccess: () => {
      // Invalidate all adjustment queries
      queryClient.invalidateQueries({ queryKey: ['adjustmentsLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentSearch'] });
    },
  });
}
