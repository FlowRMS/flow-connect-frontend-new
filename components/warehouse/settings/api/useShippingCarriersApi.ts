/**
 * Shipping Carriers React Query Hooks
 * Custom hooks for interacting with the Shipping Carriers GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchShippingCarriers,
  fetchShippingCarrierById,
  searchShippingCarriers,
  createShippingCarrier,
  updateShippingCarrier,
  deleteShippingCarrier,
  type ShippingCarrier,
  type CreateShippingCarrierInput,
  type UpdateShippingCarrierInput,
} from './shippingCarriersApi';

// ============================================================================
// Query Keys
// ============================================================================

export const shippingCarriersQueryKeys = {
  all: ['shippingCarriers'] as const,
  list: (activeOnly?: boolean) => [...shippingCarriersQueryKeys.all, 'list', { activeOnly }] as const,
  detail: (id: string) => [...shippingCarriersQueryKeys.all, 'detail', id] as const,
  search: (term: string) => [...shippingCarriersQueryKeys.all, 'search', term] as const,
};

// ============================================================================
// Shipping Carrier Hooks
// ============================================================================

/**
 * Fetch all shipping carriers
 */
export function useShippingCarriersQuery(activeOnly = false) {
  return useQuery<ShippingCarrier[], Error>({
    queryKey: shippingCarriersQueryKeys.list(activeOnly),
    queryFn: () => fetchShippingCarriers(activeOnly),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single shipping carrier by ID
 */
export function useShippingCarrierQuery(id: string) {
  return useQuery<ShippingCarrier | null, Error>({
    queryKey: shippingCarriersQueryKeys.detail(id),
    queryFn: () => fetchShippingCarrierById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Search shipping carriers by name
 */
export function useShippingCarrierSearch(searchTerm: string, limit = 20) {
  return useQuery<ShippingCarrier[], Error>({
    queryKey: shippingCarriersQueryKeys.search(searchTerm),
    queryFn: () => searchShippingCarriers(searchTerm, limit),
    enabled: searchTerm.length >= 2,
    staleTime: 60 * 1000, // 1 minute for search results
  });
}

/**
 * Create a new shipping carrier
 */
export function useCreateShippingCarrier() {
  const queryClient = useQueryClient();

  return useMutation<ShippingCarrier, Error, CreateShippingCarrierInput>({
    mutationFn: createShippingCarrier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingCarriersQueryKeys.all });
    },
  });
}

/**
 * Update an existing shipping carrier with optimistic updates
 */
export function useUpdateShippingCarrier() {
  const queryClient = useQueryClient();

  return useMutation<
    ShippingCarrier,
    Error,
    { id: string; input: UpdateShippingCarrierInput },
    { previousData: ShippingCarrier[] | undefined }
  >({
    mutationFn: ({ id, input }) => updateShippingCarrier(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: shippingCarriersQueryKeys.list() });

      const previousData = queryClient.getQueryData<ShippingCarrier[]>(
        shippingCarriersQueryKeys.list()
      );

      if (previousData) {
        queryClient.setQueryData<ShippingCarrier[]>(
          shippingCarriersQueryKeys.list(),
          previousData.map((carrier) =>
            carrier.id === id
              ? {
                  ...carrier,
                  name: input.name ?? carrier.name,
                  code: input.code ?? carrier.code,
                  accountNumber: input.accountNumber ?? carrier.accountNumber,
                  isActive: input.isActive ?? carrier.isActive,
                  paymentTerms: input.paymentTerms ?? carrier.paymentTerms,
                  apiKey: input.apiKey ?? carrier.apiKey,
                  apiEndpoint: input.apiEndpoint ?? carrier.apiEndpoint,
                  trackingUrlTemplate: input.trackingUrlTemplate ?? carrier.trackingUrlTemplate,
                  // serviceTypes: input uses Record<string, boolean>, API returns string[]
                  // Keep existing value for optimistic update, server response will have correct format
                  serviceTypes: carrier.serviceTypes,
                  defaultServiceType: input.defaultServiceType ?? carrier.defaultServiceType,
                  maxWeight: input.maxWeight ?? carrier.maxWeight,
                  maxDimensions: input.maxDimensions ?? carrier.maxDimensions,
                  residentialSurcharge: input.residentialSurcharge ?? carrier.residentialSurcharge,
                  fuelSurchargePercent: input.fuelSurchargePercent ?? carrier.fuelSurchargePercent,
                  pickupSchedule: input.pickupSchedule ?? carrier.pickupSchedule,
                  pickupLocation: input.pickupLocation ?? carrier.pickupLocation,
                  remarks: input.remarks ?? carrier.remarks,
                  internalNotes: input.internalNotes ?? carrier.internalNotes,
                }
              : carrier
          )
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(shippingCarriersQueryKeys.list(), context.previousData);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Use 'all' key to invalidate all list variants regardless of activeOnly parameter
      queryClient.invalidateQueries({ queryKey: shippingCarriersQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: shippingCarriersQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a shipping carrier
 */
export function useDeleteShippingCarrier() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteShippingCarrier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingCarriersQueryKeys.list() });
    },
  });
}

// Re-export types
export type { ShippingCarrier, CreateShippingCarrierInput, UpdateShippingCarrierInput };
