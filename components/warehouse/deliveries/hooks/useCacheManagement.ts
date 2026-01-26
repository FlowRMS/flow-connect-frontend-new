import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { warehouseDeliveriesQueryKeys } from '../../api/useWarehouseDeliveriesApi';

/**
 * Hook for intelligent cache management
 * Handles cache invalidation, prefetching, and garbage collection
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();

  /**
   * Invalidate all delivery caches (use sparingly)
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['warehouse-deliveries'],
    });
  }, [queryClient]);

  /**
   * Invalidate specific delivery by ID
   */
  const invalidateDelivery = useCallback(
    (deliveryId: string) => {
      queryClient.invalidateQueries({
        queryKey: warehouseDeliveriesQueryKeys.detail(deliveryId),
      });
    },
    [queryClient]
  );

  /**
   * Invalidate list queries for a warehouse
   */
  const invalidateWarehouseLists = useCallback(
    (warehouseId?: string | null) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key[0] !== 'warehouse-deliveries') return false;
          if (key[1] !== 'list') return false;
          if (!warehouseId) return true;
          return key[2]?.warehouseId === warehouseId;
        },
      });
    },
    [queryClient]
  );

  /**
   * Remove stale data from cache
   */
  const cleanStaleData = useCallback(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    queryClient.getQueryCache().findAll().forEach((query) => {
      const state = query.state;
      if (state.dataUpdatedAt < fiveMinutesAgo && !query.getObserversCount()) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }, [queryClient]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.findAll();

    const stats = {
      total: queries.length,
      active: queries.filter((q) => q.getObserversCount() > 0).length,
      stale: queries.filter((q) => q.isStale()).length,
      fetching: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
    };

    return stats;
  }, [queryClient]);

  /**
   * Prefetch next page of infinite query
   */
  const prefetchNextPage = useCallback(
    (warehouseId?: string | null) => {
      // Implementation would depend on current page
      // This is a placeholder for the pattern
      console.log('Prefetching next page for warehouse:', warehouseId);
    },
    []
  );

  /**
   * Automatic cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clean up stale data when component unmounts
      cleanStaleData();
    };
  }, [cleanStaleData]);

  return {
    invalidateAll,
    invalidateDelivery,
    invalidateWarehouseLists,
    cleanStaleData,
    getCacheStats,
    prefetchNextPage,
  };
}
