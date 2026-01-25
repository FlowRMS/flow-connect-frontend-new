'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  createDelivery,
  createDeliveryAssignee,
  createDeliveryDocument,
  createDeliveryIssue,
  createDeliveryItem,
  createDeliveryItemReceipt,
  createDeliveryStatusHistory,
  createRecurringShipment,
  deleteDeliveryAssignee,
  deleteDeliveryDocument,
  deleteDeliveryItem,
  deleteDeliveryItemReceipt,
  fetchDeliveries,
  fetchDeliveryById,
  fetchDeliveryIssueById,
  fetchFactories,
  fetchFactoryById,
  fetchProducts,
  fetchRecurringShipments,
  fetchShippingCarriers,
  fetchWarehouseLocations,
  fetchWarehouseMembers,
  fetchWarehouses,
  updateDelivery,
  updateDeliveryIssue,
  updateDeliveryItem,
  updateDeliveryItemReceipt,
  updateRecurringShipment,
  type DeliveryApi,
} from '../deliveries/api';
import { fetchUserById } from '@/components/lib/api/search';
import { fetchContactsByCompanyId } from '@/components/lib/graphql';
import { fetchUsers, type User } from '@/components/lib/graphql/users';

// ============================================================================
// Query Keys
// ============================================================================

export const warehouseDeliveriesQueryKeys = {
  all: ['warehouse-deliveries'] as const,
  list: (warehouseId?: string | null, includeIssues?: boolean) =>
    [...warehouseDeliveriesQueryKeys.all, 'list', { warehouseId, includeIssues }] as const,
  detail: (id: string) => [...warehouseDeliveriesQueryKeys.all, 'detail', id] as const,
  issues: (warehouseId?: string | null) =>
    [...warehouseDeliveriesQueryKeys.all, 'issues', { warehouseId }] as const,
  issueDetail: (id: string) => [...warehouseDeliveriesQueryKeys.all, 'issue', id] as const,
  recurring: (warehouseId?: string | null) =>
    [...warehouseDeliveriesQueryKeys.all, 'recurring', { warehouseId }] as const,
  warehouses: () => [...warehouseDeliveriesQueryKeys.all, 'warehouses'] as const,
  carriers: (activeOnly?: boolean) =>
    [...warehouseDeliveriesQueryKeys.all, 'carriers', { activeOnly }] as const,
  vendors: (searchTerm: string, published: boolean, limit: number) =>
    [...warehouseDeliveriesQueryKeys.all, 'vendors', { searchTerm, published, limit }] as const,
  factory: (id: string) => [...warehouseDeliveriesQueryKeys.all, 'factory', id] as const,
  products: (searchTerm: string, factoryId?: string | null, limit?: number) =>
    [...warehouseDeliveriesQueryKeys.all, 'products', { searchTerm, factoryId, limit }] as const,
  members: (warehouseId: string) => [...warehouseDeliveriesQueryKeys.all, 'members', warehouseId] as const,
  locations: (warehouseId: string) => [...warehouseDeliveriesQueryKeys.all, 'locations', warehouseId] as const,
  user: (id: string) => [...warehouseDeliveriesQueryKeys.all, 'user', id] as const,
  usersByIds: (ids: string[]) => [...warehouseDeliveriesQueryKeys.all, 'users', { ids }] as const,
  vendorContacts: (vendorId: string) =>
    [...warehouseDeliveriesQueryKeys.all, 'vendor-contacts', vendorId] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useWarehouseDeliveries(
  warehouseId?: string | null,
  options?: { includeIssues?: boolean; enabled?: boolean }
) {
  const includeIssues = options?.includeIssues ?? false;

  return useQuery<DeliveryApi[], Error>({
    queryKey: warehouseDeliveriesQueryKeys.list(warehouseId || null, includeIssues),
    queryFn: () => fetchDeliveries(warehouseId || undefined, { includeIssues }),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

// Infinite scroll version for performance optimization
export function useInfiniteWarehouseDeliveries(
  warehouseId?: string | null,
  options?: { includeIssues?: boolean; enabled?: boolean; pageSize?: number }
) {
  const includeIssues = options?.includeIssues ?? false;
  const pageSize = options?.pageSize ?? 50;

  return useInfiniteQuery<DeliveryApi[], Error>({
    queryKey: [...warehouseDeliveriesQueryKeys.list(warehouseId || null, includeIssues), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      fetchDeliveries(warehouseId || undefined, {
        includeIssues,
        limit: pageSize,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Otherwise, return the offset for the next page
      return allPages.length * pageSize;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    initialPageParam: 0,
  });
}

export function useWarehouseDelivery(id: string | null) {
  return useQuery<DeliveryApi | null, Error>({
    queryKey: id ? warehouseDeliveriesQueryKeys.detail(id) : ['warehouse-deliveries', 'detail', 'missing'],
    queryFn: () => fetchDeliveryById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useWarehouseDeliveryIssue(id: string | null) {
  return useQuery({
    queryKey: id ? warehouseDeliveriesQueryKeys.issueDetail(id) : ['warehouse-deliveries', 'issue', 'missing'],
    queryFn: () => fetchDeliveryIssueById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useWarehouseRecurringShipments(warehouseId?: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: warehouseDeliveriesQueryKeys.recurring(warehouseId || null),
    queryFn: () => fetchRecurringShipments(warehouseId || undefined),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useWarehouseLookups() {
  const warehousesQuery = useQuery({
    queryKey: warehouseDeliveriesQueryKeys.warehouses(),
    queryFn: fetchWarehouses,
    staleTime: 30 * 1000,
  });

  const carriersQuery = useQuery({
    queryKey: warehouseDeliveriesQueryKeys.carriers(true),
    queryFn: () => fetchShippingCarriers(true),
    staleTime: 30 * 1000,
  });

  const vendorsQuery = useQuery({
    queryKey: warehouseDeliveriesQueryKeys.vendors('', true, 200),
    queryFn: () => fetchFactories('', true, 200),
    staleTime: 30 * 1000,
  });

  return { warehousesQuery, carriersQuery, vendorsQuery };
}

export function useWarehouseProducts(searchTerm: string, factoryId?: string | null, limit: number = 50) {
  return useQuery({
    queryKey: warehouseDeliveriesQueryKeys.products(searchTerm.trim(), factoryId, limit),
    queryFn: () => fetchProducts(searchTerm.trim(), factoryId || undefined, limit),
    enabled: !!factoryId,
    staleTime: 30 * 1000,
  });
}

export function useWarehouseMembers(warehouseId?: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: warehouseId ? warehouseDeliveriesQueryKeys.members(warehouseId) : ['warehouse-deliveries', 'members', 'missing'],
    queryFn: () => fetchWarehouseMembers(warehouseId!),
    enabled: !!warehouseId && enabled,
    staleTime: 30 * 1000,
  });
}

export function useWarehouseLocations(warehouseId?: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: warehouseId ? warehouseDeliveriesQueryKeys.locations(warehouseId) : ['warehouse-deliveries', 'locations', 'missing'],
    queryFn: () => fetchWarehouseLocations(warehouseId!),
    enabled: !!warehouseId && enabled,
    staleTime: 30 * 1000,
  });
}

export function useFactoryById(factoryId?: string | null) {
  return useQuery({
    queryKey: factoryId ? warehouseDeliveriesQueryKeys.factory(factoryId) : ['warehouse-deliveries', 'factory', 'missing'],
    queryFn: () => fetchFactoryById(factoryId!),
    enabled: !!factoryId,
    staleTime: 30 * 1000,
  });
}

export function useUserById(userId?: string | null) {
  return useQuery({
    queryKey: userId ? warehouseDeliveriesQueryKeys.user(userId) : ['warehouse-deliveries', 'user', 'missing'],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useUsersByIds(ids: string[]) {
  const normalizedIds = Array.from(new Set(ids)).sort();
  return useQuery<User[]>({
    queryKey: warehouseDeliveriesQueryKeys.usersByIds(normalizedIds),
    queryFn: async () => {
      if (normalizedIds.length === 0) return [];
      const users = await fetchUsers();
      const lookup = new Set(normalizedIds);
      return users.filter((user) => lookup.has(user.id));
    },
    enabled: normalizedIds.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useVendorContacts(vendorId?: string | null) {
  return useQuery({
    queryKey: vendorId ? warehouseDeliveriesQueryKeys.vendorContacts(vendorId) : ['warehouse-deliveries', 'vendor-contacts', 'missing'],
    queryFn: () => fetchContactsByCompanyId(vendorId!),
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

const DELIVERY_DATA_KEYS = new Set(['list', 'detail', 'issues', 'issue', 'recurring']);

const invalidateDeliveryData = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === 'warehouse-deliveries' && DELIVERY_DATA_KEYS.has(String(key[1]));
    },
  });
};

const invalidateRecurring = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === 'warehouse-deliveries' && String(key[1]) === 'recurring';
    },
  });
};

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDelivery,
    onSuccess: () => invalidateDeliveryData(queryClient),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateDelivery(id, input),
    // Optimistic update - instantly update UI before server confirms
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: warehouseDeliveriesQueryKeys.detail(id) });

      // Snapshot previous value
      const previousDelivery = queryClient.getQueryData<DeliveryApi>(
        warehouseDeliveriesQueryKeys.detail(id)
      );

      // Optimistically update to new value
      if (previousDelivery) {
        queryClient.setQueryData<DeliveryApi>(warehouseDeliveriesQueryKeys.detail(id), {
          ...previousDelivery,
          ...input,
        });
      }

      // Return context with snapshot
      return { previousDelivery, id };
    },
    // If mutation fails, rollback to previous value
    onError: (_err, _variables, context) => {
      if (context?.previousDelivery) {
        queryClient.setQueryData(
          warehouseDeliveriesQueryKeys.detail(context.id),
          context.previousDelivery
        );
      }
    },
    // Always refetch after error or success
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.detail(id) });
      invalidateDeliveryData(queryClient);
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCreateDeliveryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryItem,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useUpdateDeliveryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateDeliveryItem(id, input),
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useDeleteDeliveryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryItem,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateDeliveryItemReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryItemReceipt,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useUpdateDeliveryItemReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateDeliveryItemReceipt(id, input),
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useDeleteDeliveryItemReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryItemReceipt,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateDeliveryDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryDocument,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useDeleteDeliveryDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryDocument,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateDeliveryAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryAssignee,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useDeleteDeliveryAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryAssignee,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateDeliveryIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryIssue,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateDeliveryStatusHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryStatusHistory,
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useUpdateDeliveryIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateDeliveryIssue(id, input),
    onSuccess: () => invalidateDeliveryData(queryClient),
  });
}

export function useCreateRecurringShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecurringShipment,
    onSuccess: () => invalidateRecurring(queryClient),
  });
}

export function useUpdateRecurringShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateRecurringShipment(id, input),
    onSuccess: () => invalidateRecurring(queryClient),
  });
}
