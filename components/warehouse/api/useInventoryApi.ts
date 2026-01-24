/**
 * Inventory API React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchInventories,
  fetchInventoryById,
  fetchInventoryByProduct,
  fetchInventoriesByProducts,
  fetchInventoryStats,
  Inventory,
  InventoryStats,
} from './inventoryApi';

// ============================================================================
// Query Keys
// ============================================================================

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (warehouseId: string, filters?: Record<string, unknown>) =>
    [...inventoryKeys.lists(), warehouseId, filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  byProduct: (productId: string, warehouseId: string) =>
    [...inventoryKeys.all, 'byProduct', productId, warehouseId] as const,
  byProducts: (productIds: string[], warehouseId: string) =>
    [...inventoryKeys.all, 'byProducts', productIds.sort().join(','), warehouseId] as const,
  stats: (warehouseId: string) => [...inventoryKeys.all, 'stats', warehouseId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

export function useInventories(
  warehouseId: string,
  options?: {
    factoryId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  },
  queryOptions?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: inventoryKeys.list(warehouseId, options),
    queryFn: () => fetchInventories(warehouseId, options),
    enabled: queryOptions?.enabled ?? !!warehouseId,
  });
}

export function useInventoryById(id: string, queryOptions?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => fetchInventoryById(id),
    enabled: queryOptions?.enabled ?? !!id,
  });
}

export function useInventoryByProduct(
  productId: string,
  warehouseId: string,
  queryOptions?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: inventoryKeys.byProduct(productId, warehouseId),
    queryFn: () => fetchInventoryByProduct(productId, warehouseId),
    enabled: queryOptions?.enabled ?? (!!productId && !!warehouseId),
  });
}

export function useInventoriesByProducts(
  productIds: string[],
  warehouseId: string,
  queryOptions?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: inventoryKeys.byProducts(productIds, warehouseId),
    queryFn: () => fetchInventoriesByProducts(productIds, warehouseId),
    enabled: queryOptions?.enabled ?? (productIds.length > 0 && !!warehouseId),
  });
}

export function useInventoryStats(
  warehouseId: string,
  queryOptions?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: inventoryKeys.stats(warehouseId),
    queryFn: () => fetchInventoryStats(warehouseId),
    enabled: queryOptions?.enabled ?? !!warehouseId,
  });
}
