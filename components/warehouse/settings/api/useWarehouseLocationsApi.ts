/**
 * Warehouse Locations React Query Hooks
 * Custom hooks for interacting with the Warehouse Locations GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchWarehouseLocations,
  fetchWarehouseLocationTree,
  fetchWarehouseLocation,
  fetchLocationProductAssignments,
  createWarehouseLocation,
  updateWarehouseLocation,
  deleteWarehouseLocation,
  bulkSaveWarehouseLocations,
  assignProductToLocation,
  updateProductQuantityAtLocation,
  removeProductFromLocation,
  type WarehouseLocation,
  type LocationProductAssignment,
  type CreateWarehouseLocationInput,
  type UpdateWarehouseLocationInput,
  type BulkWarehouseLocationInput,
} from './warehouseLocationsApi';

// ============================================================================
// Query Keys
// ============================================================================

export const warehouseLocationsQueryKeys = {
  all: ['warehouseLocations'] as const,
  list: (warehouseId: string) => [...warehouseLocationsQueryKeys.all, 'list', warehouseId] as const,
  tree: (warehouseId: string) => [...warehouseLocationsQueryKeys.all, 'tree', warehouseId] as const,
  detail: (id: string) => [...warehouseLocationsQueryKeys.all, 'detail', id] as const,
  productAssignments: (locationId: string) =>
    [...warehouseLocationsQueryKeys.all, 'productAssignments', locationId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all locations for a warehouse (flat list)
 */
export function useWarehouseLocationsQuery(warehouseId: string | null) {
  return useQuery<WarehouseLocation[], Error>({
    queryKey: warehouseLocationsQueryKeys.list(warehouseId || ''),
    queryFn: () => fetchWarehouseLocations(warehouseId!),
    enabled: !!warehouseId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch location tree for a warehouse (hierarchical with nested children)
 */
export function useWarehouseLocationTreeQuery(warehouseId: string | null) {
  return useQuery<WarehouseLocation[], Error>({
    queryKey: warehouseLocationsQueryKeys.tree(warehouseId || ''),
    queryFn: () => fetchWarehouseLocationTree(warehouseId!),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single location by ID
 */
export function useWarehouseLocationQuery(id: string | null) {
  return useQuery<WarehouseLocation | null, Error>({
    queryKey: warehouseLocationsQueryKeys.detail(id || ''),
    queryFn: () => fetchWarehouseLocation(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch product assignments for a location
 */
export function useLocationProductAssignmentsQuery(locationId: string | null) {
  return useQuery<LocationProductAssignment[], Error>({
    queryKey: warehouseLocationsQueryKeys.productAssignments(locationId || ''),
    queryFn: () => fetchLocationProductAssignments(locationId!),
    enabled: !!locationId,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new location
 */
export function useCreateWarehouseLocation() {
  const queryClient = useQueryClient();

  return useMutation<WarehouseLocation, Error, CreateWarehouseLocationInput>({
    mutationFn: createWarehouseLocation,
    onSuccess: (_data, variables) => {
      // Invalidate both list and tree queries for this warehouse
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.list(variables.warehouseId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
      });
    },
  });
}

/**
 * Update an existing location
 */
export function useUpdateWarehouseLocation() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseLocation,
    Error,
    { id: string; input: UpdateWarehouseLocationInput }
  >({
    mutationFn: ({ id, input }) => updateWarehouseLocation(id, input),
    onSuccess: (_data, variables) => {
      // Invalidate queries for this warehouse
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.list(variables.input.warehouseId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.tree(variables.input.warehouseId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a location (cascade deletes children)
 */
export function useDeleteWarehouseLocation() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; warehouseId: string }>({
    mutationFn: ({ id }) => deleteWarehouseLocation(id),
    onSuccess: (_data, variables) => {
      // Invalidate queries for this warehouse
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.list(variables.warehouseId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
      });
    },
  });
}

/**
 * Bulk save locations for a warehouse
 * Creates new locations, updates existing ones, and deletes removed ones
 */
export function useBulkSaveWarehouseLocations() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseLocation[],
    Error,
    { warehouseId: string; locations: BulkWarehouseLocationInput[] }
  >({
    mutationFn: ({ warehouseId, locations }) =>
      bulkSaveWarehouseLocations(warehouseId, locations),
    onSuccess: (_data, variables) => {
      // Invalidate queries for this warehouse
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.list(variables.warehouseId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
      });
    },
  });
}

// ============================================================================
// Product Assignment Hooks
// ============================================================================

/**
 * Assign a product to a location
 */
export function useAssignProductToLocation() {
  const queryClient = useQueryClient();

  return useMutation<
    LocationProductAssignment,
    Error,
    { locationId: string; productId: string; quantity: number; warehouseId?: string }
  >({
    mutationFn: ({ locationId, productId, quantity }) =>
      assignProductToLocation(locationId, productId, quantity),
    onSuccess: (_data, variables) => {
      // Invalidate product assignments for this location
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.productAssignments(variables.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.detail(variables.locationId),
      });
      // Invalidate tree if warehouseId is provided
      if (variables.warehouseId) {
        queryClient.invalidateQueries({
          queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
        });
      }
    },
  });
}

/**
 * Update product quantity at a location
 */
export function useUpdateProductQuantityAtLocation() {
  const queryClient = useQueryClient();

  return useMutation<
    LocationProductAssignment,
    Error,
    { locationId: string; productId: string; quantity: number; warehouseId?: string }
  >({
    mutationFn: ({ locationId, productId, quantity }) =>
      updateProductQuantityAtLocation(locationId, productId, quantity),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.productAssignments(variables.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.detail(variables.locationId),
      });
      if (variables.warehouseId) {
        queryClient.invalidateQueries({
          queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
        });
      }
    },
  });
}

/**
 * Remove a product from a location
 */
export function useRemoveProductFromLocation() {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    Error,
    { locationId: string; productId: string; warehouseId?: string }
  >({
    mutationFn: ({ locationId, productId }) =>
      removeProductFromLocation(locationId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.productAssignments(variables.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseLocationsQueryKeys.detail(variables.locationId),
      });
      if (variables.warehouseId) {
        queryClient.invalidateQueries({
          queryKey: warehouseLocationsQueryKeys.tree(variables.warehouseId),
        });
      }
    },
  });
}

// Re-export types
export type {
  WarehouseLocation,
  LocationProductAssignment,
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  BulkWarehouseLocationInput,
};

// Re-export constants
export { LEVEL_TO_NUMBER, NUMBER_TO_LEVEL, type LocationLevel } from './warehouseLocationsApi';
