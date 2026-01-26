/**
 * Shipment Request React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listShipmentRequests,
  createShipmentRequest,
  updateShipmentRequestStatus,
  type ShipmentRequest,
  type ShipmentRequestStatus,
  type CreateShipmentRequestInput,
} from './shipmentRequestApi';

// ============================================================================
// Query Keys
// ============================================================================

export const shipmentRequestKeys = {
  all: ['shipmentRequests'] as const,
  lists: () => [...shipmentRequestKeys.all, 'list'] as const,
  list: (warehouseId: string, status?: ShipmentRequestStatus) =>
    [...shipmentRequestKeys.lists(), { warehouseId, status }] as const,
  details: () => [...shipmentRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentRequestKeys.details(), id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch shipment requests for a warehouse
 */
export function useShipmentRequests(
  warehouseId: string,
  status?: ShipmentRequestStatus,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: shipmentRequestKeys.list(warehouseId, status),
    queryFn: () => listShipmentRequests(warehouseId, status),
    enabled: options?.enabled ?? !!warehouseId,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to create a shipment request
 */
export function useCreateShipmentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShipmentRequestInput) =>
      createShipmentRequest(input),
    onSuccess: (data) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({
        queryKey: shipmentRequestKeys.lists(),
      });
    },
  });
}

/**
 * Hook to update shipment request status
 */
export function useUpdateShipmentRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ShipmentRequestStatus;
      notes?: string;
    }) => updateShipmentRequestStatus(id, status, notes),
    onSuccess: (data) => {
      // Invalidate both the list and detail queries
      queryClient.invalidateQueries({
        queryKey: shipmentRequestKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: shipmentRequestKeys.detail(data.id),
      });
    },
  });
}
