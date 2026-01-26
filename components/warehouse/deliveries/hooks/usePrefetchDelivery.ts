import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchDeliveryById } from '../api/queries';
import { warehouseDeliveriesQueryKeys } from '../../api/useWarehouseDeliveriesApi';

/**
 * Hook to prefetch delivery data on hover for instant navigation
 * Improves perceived performance by loading data before user clicks
 */
export function usePrefetchDelivery() {
  const queryClient = useQueryClient();

  const prefetchDelivery = useCallback(
    (deliveryId: string) => {
      // Only prefetch if data is not already in cache
      const existingData = queryClient.getQueryData(
        warehouseDeliveriesQueryKeys.detail(deliveryId)
      );

      if (!existingData) {
        queryClient.prefetchQuery({
          queryKey: warehouseDeliveriesQueryKeys.detail(deliveryId),
          queryFn: () => fetchDeliveryById(deliveryId),
          staleTime: 30 * 1000, // Consider fresh for 30 seconds
        });
      }
    },
    [queryClient]
  );

  return prefetchDelivery;
}
