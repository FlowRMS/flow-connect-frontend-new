/**
 * Checks API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Import everything for local use in hooks
import {
  fetchCheckById as _fetchCheckById,
  searchChecks as _searchChecks,
  fetchChecksByFactory as _fetchChecksByFactory,
  fetchChecksLandingPage as _fetchChecksLandingPage,
  createCheck as _createCheck,
  updateCheck as _updateCheck,
  deleteCheck as _deleteCheck,
  fetchPostedStatement as _fetchPostedStatement,
  postCheck as _postCheck,
  type CreateCheckInput,
  type UpdateCheckInput,
} from '../../lib/graphql/checks';

// Re-export everything from the centralized checks module
export {
  fetchCheckById,
  searchChecks,
  fetchChecksByFactory,
  fetchChecksLandingPage,
  createCheck,
  updateCheck,
  deleteCheck,
  fetchPostedStatement,
  postCheck,
  type Check,
  type CheckLandingPage,
  type CheckFactory,
  type CheckInvoice,
  type CheckInvoiceOrder,
  type CheckInvoiceOrderCustomer,
  type CheckInvoiceSalesRep,
  type CheckInvoiceBalance,
  type CheckCredit,
  type CheckCreditOrder,
  type CheckAdjustment,
  type CheckAdjustmentFactory,
  type CheckAdjustmentCustomer,
  type CheckDetail,
  type CheckStatus,
  type CheckCreationType,
  type CheckSearchResult,
  type CreateCheckInput,
  type UpdateCheckInput,
  type CheckDetailInput,
  type FindChecksLandingPagesResponse,
  type PostedStatement,
  type PostedStatementHeader,
  type PostedStatementDetail,
  type PostedStatementRepSummary,
} from '../../lib/graphql/checks';

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { CheckLandingPage, CheckLandingPageFilter, CheckLandingPageOrderBy, FindChecksLandingPagesResponse } from '../../lib/graphql/checks';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook to fetch a single check
 */
export function useCheck(checkId: string | null) {
  return useQuery({
    queryKey: ['check', checkId],
    queryFn: () => (checkId ? _fetchCheckById(checkId) : null),
    enabled: !!checkId,
  });
}

/**
 * Hook to fetch checks (landing page) - non-paginated for backward compatibility
 */
export function useChecksLandingPage(
  filters?: CheckLandingPageFilter[],
  limit?: number,
  orderBy?: CheckLandingPageOrderBy[]
) {
  return useQuery({
    queryKey: ['checksLandingPage', filters, limit, orderBy],
    queryFn: () => _fetchChecksLandingPage(filters, limit, 0, orderBy),
  });
}

/**
 * Hook to fetch checks with infinite scroll pagination
 */
export function useChecksInfinite(
  filters?: CheckLandingPageFilter[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  orderBy?: CheckLandingPageOrderBy[]
) {
  return useInfiniteQuery<FindChecksLandingPagesResponse, Error>({
    queryKey: ['checksInfinite', filters, pageSize, orderBy],
    queryFn: async ({ pageParam = 0 }) => {
      return _fetchChecksLandingPage(filters, pageSize, pageParam as number, orderBy);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to search checks
 */
export function useCheckSearch(searchTerm: string, limit: number = 50) {
  return useQuery({
    queryKey: ['checkSearch', searchTerm, limit],
    queryFn: () => _searchChecks(searchTerm, limit),
  });
}

/**
 * Hook to fetch checks by factory
 */
export function useChecksByFactory(factoryId: string | null) {
  return useQuery({
    queryKey: ['checksByFactory', factoryId],
    queryFn: () => (factoryId ? _fetchChecksByFactory(factoryId) : []),
    enabled: !!factoryId,
  });
}

/**
 * Fetch all check IDs for bulk operations
 * Used when user selects all including unloaded items
 */
export async function fetchAllCheckIds(
  filters?: CheckLandingPageFilter[]
): Promise<string[]> {
  // First get the total count
  const initialResult = await _fetchChecksLandingPage(filters, 1, 0);
  const total = initialResult.total;

  if (total === 0) return [];

  // Fetch all IDs in batches
  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await _fetchChecksLandingPage(filters, batchSize, offset);
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}

/**
 * Hook to create a check
 */
export function useCreateCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCheckInput) => _createCheck(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['checksLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['checksInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['checkSearch'] });
      queryClient.invalidateQueries({ queryKey: ['checksByFactory'] });
    },
  });
}

/**
 * Hook to update a check
 */
export function useUpdateCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCheckInput) => _updateCheck(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['check', data.id] });
      queryClient.invalidateQueries({ queryKey: ['checksLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['checksInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['checkSearch'] });
      queryClient.invalidateQueries({ queryKey: ['checksByFactory'] });
    },
  });
}

/**
 * Hook to delete a check
 */
export function useDeleteCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => _deleteCheck(id),
    onSuccess: () => {
      // Invalidate all check queries
      queryClient.invalidateQueries({ queryKey: ['checksLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['checksInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['checkSearch'] });
      queryClient.invalidateQueries({ queryKey: ['checksByFactory'] });
    },
  });
}

/**
 * Hook to fetch posted statement data for a check
 * Returns summary, header, and detail information for a posted check
 */
export function usePostedStatement(checkId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['postedStatement', checkId],
    queryFn: () => (checkId ? _fetchPostedStatement(checkId) : null),
    enabled: !!checkId && enabled,
  });
}

/**
 * Hook to post a check
 * Changes status from OPEN to POSTED, finalizing the check
 */
export function usePostCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkId: string) => _postCheck(checkId),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['check', data.id] });
      queryClient.invalidateQueries({ queryKey: ['checksLandingPage'] });
      queryClient.invalidateQueries({ queryKey: ['checksInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['checkSearch'] });
      queryClient.invalidateQueries({ queryKey: ['checksByFactory'] });
      queryClient.invalidateQueries({ queryKey: ['postedStatement', data.id] });
    },
  });
}
