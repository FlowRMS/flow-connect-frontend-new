/**
 * useProductStat Hook
 * Custom hook for fetching product statistics independently
 * Uses limit: 1 to only get the total count efficiently
 */

import { useQuery } from '@tanstack/react-query';
import { fetchProductsWithPagination } from '../../../api/productsApi';
import type { ProductLandingPageFilter } from '../../../api/useProductsApi';
import { productQueryKeys } from '../../../api/useProductsApi';

interface UseProductStatResult {
  total: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch product count with specific filters
 * @param filters - Optional filters to apply (e.g., published: true, approvalNeeded: true)
 * @returns Total count, loading state, and error
 */
export function useProductStat(filters?: ProductLandingPageFilter[]): UseProductStatResult {
  const { data, isLoading, error } = useQuery({
    queryKey: [...productQueryKeys.productLandingPages(filters, undefined), 'stat'],
    queryFn: async () => {
      const result = await fetchProductsWithPagination(
        filters,
        undefined, // No ordering needed for stats
        { limit: 1, offset: 0 } // Only need total, not records
      );
      return result.total;
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: 1, // Only retry once on error
  });

  return {
    total: data ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
