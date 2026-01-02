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
  type Check,
  type CheckLandingPage,
  type CheckFactory,
  type CheckInvoice,
  type CheckInvoiceOrder,
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
} from '../../lib/graphql/checks';

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
 * Hook to fetch checks (landing page)
 */
export function useChecksLandingPage(
  filters?: Array<{ columnName: string; operator: string; value: string }>,
  limit?: number
) {
  return useQuery({
    queryKey: ['checksLandingPage', filters, limit],
    queryFn: () => _fetchChecksLandingPage(filters, limit),
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
 * Hook to create a check
 */
export function useCreateCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCheckInput) => _createCheck(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['checksLandingPage'] });
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
      queryClient.invalidateQueries({ queryKey: ['checkSearch'] });
      queryClient.invalidateQueries({ queryKey: ['checksByFactory'] });
    },
  });
}
