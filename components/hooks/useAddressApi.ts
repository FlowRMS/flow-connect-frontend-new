/**
 * Address API Hooks
 * React Query hooks for address CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAddress,
  fetchAddressesBySource,
  fetchAddressesBySourceId,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
  type AddressSourceType,
  type CreateAddressInput,
  type UpdateAddressInput,
} from '../lib/graphql/addresses';

// ============================================================================
// Query Keys
// ============================================================================

export const addressQueryKeys = {
  all: ['addresses'] as const,
  byId: (id: string) => [...addressQueryKeys.all, 'byId', id] as const,
  bySource: (sourceId: string, sourceType: AddressSourceType) =>
    [...addressQueryKeys.all, 'bySource', sourceId, sourceType] as const,
  bySourceId: (sourceId: string) =>
    [...addressQueryKeys.all, 'bySourceId', sourceId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single address by ID
 */
export function useAddress(id: string) {
  return useQuery<Address | null, Error>({
    queryKey: addressQueryKeys.byId(id),
    queryFn: () => fetchAddress(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all addresses for a source entity (e.g., CUSTOMER, COMPANY)
 */
export function useAddressesBySource(sourceId: string, sourceType: AddressSourceType) {
  return useQuery<Address[], Error>({
    queryKey: addressQueryKeys.bySource(sourceId, sourceType),
    queryFn: () => fetchAddressesBySource(sourceId, sourceType),
    enabled: !!sourceId && !!sourceType,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all addresses for a source ID
 */
export function useAddressesBySourceId(sourceId: string) {
  return useQuery<Address[], Error>({
    queryKey: addressQueryKeys.bySourceId(sourceId),
    queryFn: () => fetchAddressesBySourceId(sourceId),
    enabled: !!sourceId,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation<Address, Error, CreateAddressInput>({
    mutationFn: createAddress,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySource(data.sourceId, data.sourceType),
      });
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySourceId(data.sourceId),
      });
    },
  });
}

/**
 * Update an existing address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation<Address, Error, { id: string; input: UpdateAddressInput }>({
    mutationFn: ({ id, input }) => updateAddress(id, input),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.byId(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySource(data.sourceId, data.sourceType),
      });
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySourceId(data.sourceId),
      });
    },
  });
}

/**
 * Delete an address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    Error,
    { id: string; sourceId: string; sourceType: AddressSourceType }
  >({
    mutationFn: ({ id }) => deleteAddress(id),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.byId(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySource(variables.sourceId, variables.sourceType),
      });
      queryClient.invalidateQueries({
        queryKey: addressQueryKeys.bySourceId(variables.sourceId),
      });
    },
  });
}

// ============================================================================
// Re-export types
// ============================================================================

export type {
  Address,
  AddressSourceType,
  CreateAddressInput,
  UpdateAddressInput,
};
