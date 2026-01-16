/**
 * Warehouses React Query Hooks
 * Custom hooks for interacting with the Warehouses GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchWarehouses,
  fetchWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  assignWorkerToWarehouse,
  updateWorkerRole,
  removeWorkerFromWarehouse,
  updateWarehouseSettings,
  updateWarehouseStructure,
  fetchWarehouseAddresses,
  createWarehouseAddress,
  updateWarehouseAddress,
  deleteWarehouseAddress,
  type Warehouse,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type WarehouseMember,
  type WarehouseSettings,
  type WarehouseSettingsInput,
  type WarehouseStructure,
  type WarehouseStructureLevelInput,
  type WarehouseAddress,
  type AddressInput,
} from './warehousesApi';

// ============================================================================
// Query Keys
// ============================================================================

export const warehousesQueryKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehousesQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...warehousesQueryKeys.all, 'detail', id] as const,
  addresses: (warehouseId: string) => [...warehousesQueryKeys.all, 'addresses', warehouseId] as const,
};

// ============================================================================
// Warehouse Hooks
// ============================================================================

/**
 * Fetch all warehouses
 */
export function useWarehousesQuery() {
  return useQuery<Warehouse[], Error>({
    queryKey: warehousesQueryKeys.list(),
    queryFn: () => fetchWarehouses(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single warehouse by ID
 */
export function useWarehouseQuery(id: string) {
  return useQuery<Warehouse | null, Error>({
    queryKey: warehousesQueryKeys.detail(id),
    queryFn: () => fetchWarehouseById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<Warehouse, Error, CreateWarehouseInput>({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
    },
  });
}

/**
 * Update an existing warehouse with optimistic updates
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<
    Warehouse,
    Error,
    { id: string; input: UpdateWarehouseInput },
    { previousData: Warehouse[] | undefined }
  >({
    mutationFn: ({ id, input }) => updateWarehouse(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: warehousesQueryKeys.list() });

      const previousData = queryClient.getQueryData<Warehouse[]>(warehousesQueryKeys.list());

      if (previousData) {
        queryClient.setQueryData<Warehouse[]>(
          warehousesQueryKeys.list(),
          previousData.map((warehouse) =>
            warehouse.id === id
              ? {
                  ...warehouse,
                  name: input.name ?? warehouse.name,
                  status: input.status ?? warehouse.status,
                  description: input.description ?? warehouse.description,
                  isActive: input.isActive ?? warehouse.isActive,
                }
              : warehouse
          )
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(warehousesQueryKeys.list(), context.previousData);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
    },
  });
}

// ============================================================================
// Worker Management Hooks
// ============================================================================

/**
 * Assign a worker to a warehouse
 */
export function useAssignWorkerToWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseMember,
    Error,
    { warehouseId: string; userId: string; role: number }
  >({
    mutationFn: ({ warehouseId, userId, role }) =>
      assignWorkerToWarehouse(warehouseId, userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.detail(variables.warehouseId),
      });
    },
  });
}

/**
 * Update a worker's role
 */
export function useUpdateWorkerRole() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseMember,
    Error,
    { warehouseId: string; userId: string; role: number }
  >({
    mutationFn: ({ warehouseId, userId, role }) =>
      updateWorkerRole(warehouseId, userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.detail(variables.warehouseId),
      });
    },
  });
}

/**
 * Remove a worker from a warehouse
 */
export function useRemoveWorkerFromWarehouse() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { warehouseId: string; userId: string }>({
    mutationFn: ({ warehouseId, userId }) =>
      removeWorkerFromWarehouse(warehouseId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.detail(variables.warehouseId),
      });
    },
  });
}

// ============================================================================
// Settings & Structure Hooks
// ============================================================================

/**
 * Update warehouse settings
 */
export function useUpdateWarehouseSettings() {
  const queryClient = useQueryClient();

  return useMutation<WarehouseSettings, Error, WarehouseSettingsInput>({
    mutationFn: updateWarehouseSettings,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.detail(variables.warehouseId),
      });
    },
  });
}

/**
 * Update warehouse structure (location levels)
 */
export function useUpdateWarehouseStructure() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseStructure[],
    Error,
    { warehouseId: string; levels: WarehouseStructureLevelInput[] }
  >({
    mutationFn: ({ warehouseId, levels }) =>
      updateWarehouseStructure(warehouseId, levels),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.detail(variables.warehouseId),
      });
    },
  });
}

// ============================================================================
// Address Hooks
// ============================================================================

/**
 * Fetch addresses for a warehouse
 */
export function useWarehouseAddressesQuery(warehouseId: string | null) {
  return useQuery<WarehouseAddress[], Error>({
    queryKey: warehousesQueryKeys.addresses(warehouseId || ''),
    queryFn: () => fetchWarehouseAddresses(warehouseId!),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new warehouse address
 */
export function useCreateWarehouseAddress() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseAddress,
    Error,
    { warehouseId: string; address: Omit<AddressInput, 'sourceId' | 'sourceType'> }
  >({
    mutationFn: ({ warehouseId, address }) => createWarehouseAddress(warehouseId, address),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.addresses(variables.warehouseId),
      });
    },
  });
}

/**
 * Update an existing warehouse address
 */
export function useUpdateWarehouseAddress() {
  const queryClient = useQueryClient();

  return useMutation<
    WarehouseAddress,
    Error,
    { addressId: string; warehouseId: string; address: Omit<AddressInput, 'sourceId' | 'sourceType'> }
  >({
    mutationFn: ({ addressId, warehouseId, address }) =>
      updateWarehouseAddress(addressId, warehouseId, address),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.addresses(variables.warehouseId),
      });
    },
  });
}

/**
 * Delete a warehouse address
 */
export function useDeleteWarehouseAddress() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { addressId: string; warehouseId: string }>({
    mutationFn: ({ addressId }) => deleteWarehouseAddress(addressId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehousesQueryKeys.addresses(variables.warehouseId),
      });
    },
  });
}

// Re-export types
export type {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseMember,
  WarehouseSettings,
  WarehouseSettingsInput,
  WarehouseStructure,
  WarehouseStructureLevelInput,
  WarehouseAddress,
  AddressInput,
};
