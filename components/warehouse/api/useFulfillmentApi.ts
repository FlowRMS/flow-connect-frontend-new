/**
 * Fulfillment React Query Hooks
 * Custom hooks for interacting with the Fulfillment GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchFulfillmentOrders,
  fetchFulfillmentOrder,
  fetchFulfillmentStats,
  createFulfillmentOrder,
  updateFulfillmentOrder,
  releaseToWarehouse,
  cancelFulfillmentOrder,
  bulkAssignFulfillmentOrders,
  startPicking,
  updatePickedQuantity,
  completePicking,
  reportInventoryDiscrepancy,
  addPackingBox,
  updatePackingBox,
  assignItemToBox,
  removeItemFromBox,
  deletePackingBox,
  completePacking,
  completeShipping,
  markCommunicated,
  markDelivered,
  addFulfillmentNote,
  // Assignment functions
  addFulfillmentAssignment,
  removeFulfillmentAssignment,
  // Backorder functions
  fetchBackorderItems,
  markManufacturerFulfilled,
  splitFulfillmentLineItem,
  cancelBackorderItems,
  resolveBackorder,
  type FulfillmentOrder,
  type FulfillmentOrderLineItem,
  type FulfillmentStats,
  type PackingBox,
  type FulfillmentFilters,
  type CreateFulfillmentOrderInput,
  type UpdateFulfillmentOrderInput,
  type UpdatePickedQuantityInput,
  type CreatePackingBoxInput,
  type UpdatePackingBoxInput,
  type AssignItemToBoxInput,
  type CompleteShippingInput,
  type BulkAssignmentInput,
  type FulfillmentAssignmentRole,
  type MarkManufacturerFulfilledInput,
  type SplitLineItemInput,
  type CancelBackorderInput,
} from './fulfillmentApi';

// ============================================================================
// Query Keys
// ============================================================================

export const fulfillmentQueryKeys = {
  all: ['fulfillment'] as const,
  orders: (filters?: FulfillmentFilters) =>
    [...fulfillmentQueryKeys.all, 'orders', { filters }] as const,
  order: (id: string) => [...fulfillmentQueryKeys.all, 'order', id] as const,
  stats: (warehouseId?: string) =>
    [...fulfillmentQueryKeys.all, 'stats', warehouseId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch fulfillment orders with optional filters
 */
export function useFulfillmentOrders(filters?: FulfillmentFilters) {
  return useQuery<FulfillmentOrder[], Error>({
    queryKey: fulfillmentQueryKeys.orders(filters),
    queryFn: () => fetchFulfillmentOrders(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single fulfillment order by ID
 */
export function useFulfillmentOrder(id: string) {
  return useQuery<FulfillmentOrder | null, Error>({
    queryKey: fulfillmentQueryKeys.order(id),
    queryFn: () => fetchFulfillmentOrder(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch fulfillment statistics
 */
export function useFulfillmentStats(warehouseId?: string) {
  return useQuery<FulfillmentStats, Error>({
    queryKey: fulfillmentQueryKeys.stats(warehouseId),
    queryFn: () => fetchFulfillmentStats(warehouseId),
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks - Order Lifecycle
// ============================================================================

/**
 * Create a new fulfillment order
 */
export function useCreateFulfillmentOrder() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, CreateFulfillmentOrderInput>({
    mutationFn: createFulfillmentOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Update a fulfillment order
 */
export function useUpdateFulfillmentOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    FulfillmentOrder,
    Error,
    { id: string; input: UpdateFulfillmentOrderInput }
  >({
    mutationFn: ({ id, input }) => updateFulfillmentOrder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
    },
  });
}

/**
 * Release fulfillment order to warehouse
 */
export function useReleaseToWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: releaseToWarehouse,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Cancel a fulfillment order
 */
export function useCancelFulfillmentOrder() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => cancelFulfillmentOrder(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Bulk assign users to fulfillment orders
 */
export function useBulkAssignFulfillmentOrders() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder[], Error, BulkAssignmentInput>({
    mutationFn: bulkAssignFulfillmentOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

// ============================================================================
// Mutation Hooks - Picking
// ============================================================================

/**
 * Start picking process
 */
export function useStartPicking() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: startPicking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Update picked quantity for a line item
 */
export function useUpdatePickedQuantity() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrderLineItem, Error, UpdatePickedQuantityInput>({
    mutationFn: updatePickedQuantity,
    onSuccess: () => {
      // Invalidate related queries - we don't have the order ID here,
      // so we invalidate all orders
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Complete picking process
 */
export function useCompletePicking() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: completePicking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Report inventory discrepancy
 */
export function useReportInventoryDiscrepancy() {
  const queryClient = useQueryClient();

  return useMutation<
    FulfillmentOrder,
    Error,
    { lineItemId: string; actualQuantity: number; reason: string }
  >({
    mutationFn: ({ lineItemId, actualQuantity, reason }) =>
      reportInventoryDiscrepancy(lineItemId, actualQuantity, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

// ============================================================================
// Mutation Hooks - Packing
// ============================================================================

/**
 * Add a packing box
 */
export function useAddPackingBox() {
  const queryClient = useQueryClient();

  return useMutation<
    PackingBox,
    Error,
    { fulfillmentOrderId: string; input: CreatePackingBoxInput }
  >({
    mutationFn: ({ fulfillmentOrderId, input }) => addPackingBox(fulfillmentOrderId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: fulfillmentQueryKeys.order(variables.fulfillmentOrderId),
      });
    },
  });
}

/**
 * Update a packing box
 */
export function useUpdatePackingBox() {
  const queryClient = useQueryClient();

  return useMutation<PackingBox, Error, { boxId: string; input: UpdatePackingBoxInput }>({
    mutationFn: ({ boxId, input }) => updatePackingBox(boxId, input),
    onSuccess: () => {
      // Invalidate all since we don't have the order ID
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Assign item to a packing box
 */
export function useAssignItemToBox() {
  const queryClient = useQueryClient();

  return useMutation<PackingBox, Error, AssignItemToBoxInput>({
    mutationFn: assignItemToBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Remove item from a packing box
 */
export function useRemoveItemFromBox() {
  const queryClient = useQueryClient();

  return useMutation<PackingBox, Error, { boxId: string; lineItemId: string }>({
    mutationFn: ({ boxId, lineItemId }) => removeItemFromBox(boxId, lineItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Delete a packing box
 */
export function useDeletePackingBox() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deletePackingBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Complete packing process
 */
export function useCompletePacking() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: completePacking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

// ============================================================================
// Mutation Hooks - Shipping
// ============================================================================

/**
 * Complete shipping process
 */
export function useCompleteShipping() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, { id: string; input: CompleteShippingInput }>({
    mutationFn: ({ id, input }) => completeShipping(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Mark order as communicated (shipping confirmation sent)
 */
export function useMarkCommunicated() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: markCommunicated,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Mark order as delivered
 */
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: markDelivered,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

// ============================================================================
// Mutation Hooks - Notes
// ============================================================================

/**
 * Add a note to a fulfillment order
 */
export function useAddFulfillmentNote() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, { fulfillmentOrderId: string; content: string }>({
    mutationFn: ({ fulfillmentOrderId, content }) =>
      addFulfillmentNote(fulfillmentOrderId, content),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
    },
  });
}

// ============================================================================
// Mutation Hooks - Assignments
// ============================================================================

/**
 * Add a user assignment to a fulfillment order
 */
export function useAddFulfillmentAssignment() {
  const queryClient = useQueryClient();

  return useMutation<
    FulfillmentOrder,
    Error,
    { fulfillmentOrderId: string; userId: string; role: FulfillmentAssignmentRole }
  >({
    mutationFn: ({ fulfillmentOrderId, userId, role }) =>
      addFulfillmentAssignment(fulfillmentOrderId, userId, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
    },
  });
}

/**
 * Remove an assignment from a fulfillment order
 */
export function useRemoveFulfillmentAssignment() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: removeFulfillmentAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
    },
  });
}

// ============================================================================
// Query Hooks - Backorder
// ============================================================================

/**
 * Fetch backorder items for a fulfillment order
 */
export function useBackorderItems(fulfillmentOrderId: string) {
  return useQuery<FulfillmentOrderLineItem[], Error>({
    queryKey: [...fulfillmentQueryKeys.order(fulfillmentOrderId), 'backorder'],
    queryFn: () => fetchBackorderItems(fulfillmentOrderId),
    enabled: !!fulfillmentOrderId,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks - Backorder
// ============================================================================

/**
 * Mark line items as being fulfilled by manufacturer
 */
export function useMarkManufacturerFulfilled() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, MarkManufacturerFulfilledInput>({
    mutationFn: markManufacturerFulfilled,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Split a line item between warehouse and manufacturer fulfillment
 */
export function useSplitFulfillmentLineItem() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrderLineItem, Error, SplitLineItemInput>({
    mutationFn: splitFulfillmentLineItem,
    onSuccess: () => {
      // Invalidate all since we don't have the order ID
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all });
    },
  });
}

/**
 * Cancel backorder items
 */
export function useCancelBackorderItems() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, CancelBackorderInput>({
    mutationFn: cancelBackorderItems,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}

/**
 * Resolve backorder status and continue fulfillment
 */
export function useResolveBackorder() {
  const queryClient = useQueryClient();

  return useMutation<FulfillmentOrder, Error, string>({
    mutationFn: resolveBackorder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.stats() });
    },
  });
}
