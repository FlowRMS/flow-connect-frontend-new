import type { QueryClient } from '@tanstack/react-query';

/**
 * Balances performance, freshness, and cache management
 */
export const deliveriesQueryConfig = {
  queries: {
    // Cache times
    staleTime: 30 * 1000, // 30 seconds - data considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time (formerly cacheTime)

    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch configuration
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: false, // Don't refetch if data is fresh

    // Network mode
    networkMode: 'online' as const, // Only fetch when online
  },

  mutations: {
    // Retry failed mutations
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Network mode
    networkMode: 'online' as const,
  },
};

/**
 * Configure query client with deliveries-specific settings
 */
export function configureDeliveriesQueryClient(queryClient: QueryClient) {
  // Set default options for deliveries queries
  queryClient.setDefaultOptions({
    queries: deliveriesQueryConfig.queries,
    mutations: deliveriesQueryConfig.mutations,
  });

  return queryClient;
}

/**
 * Cache key patterns for selective invalidation
 */
export const cachePatterns = {
  // Invalidate all delivery list queries
  lists: (warehouseId?: string) => {
    const base = ['warehouse-deliveries', 'list'];
    return warehouseId ? [...base, { warehouseId }] : base;
  },

  // Invalidate specific delivery detail
  detail: (deliveryId: string) => ['warehouse-deliveries', 'detail', deliveryId],

  // Invalidate all delivery-related data
  all: () => ['warehouse-deliveries'],
};

/**
 * Prefetch strategy configuration
 */
export const prefetchConfig = {
  // Prefetch next page when user scrolls to 80% of current content
  infiniteScrollThreshold: 0.8,

  // Prefetch on hover after this delay (ms)
  hoverPrefetchDelay: 200,

  // Maximum number of items to prefetch
  maxPrefetchItems: 10,
};
