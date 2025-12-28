/**
 * Orders API React Query Hooks
 * Provides hooks for fetching and mutating orders data
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchOrdersWithPagination,
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  type Order,
  type OrderLandingPage,
  type OrderLandingPageFilter,
  type OrderLandingPageOrderBy,
  type PaginatedOrdersResult,
  type CreateOrderInput,
  type UpdateOrderInput,
} from './ordersApi';
// Import search functions from quotes API (same as quotes-v2 uses - avoids GraphQL schema issues)
import {
  searchCustomers,
  searchFactories,
  searchUsers,
  searchProducts,
  listProductCpns,
  listProductUoms,
  type CustomerSearchResult,
  type FactorySearchResult,
  type UserSearchResult,
  type ProductSearchResult,
  type ProductCpnResult,
  type ProductUomResult,
} from '@/components/quotes/api/quotesApi';
// Import job search from central API
import {
  searchJobs,
  type JobSearchResult,
} from '@/components/lib/api/search';

// ============================================================================
// Query Keys
// ============================================================================

export const orderQueryKeys = {
  all: ['orders'] as const,
  orders: () => [...orderQueryKeys.all, 'list'] as const,
  orderLandingPages: (filters?: OrderLandingPageFilter[], orderBy?: OrderLandingPageOrderBy[]) =>
    [...orderQueryKeys.all, 'landingPages', { filters, orderBy }] as const,
  order: (id: string) => [...orderQueryKeys.all, 'detail', id] as const,
  // Search keys
  customerSearch: (searchTerm: string) =>
    [...orderQueryKeys.all, 'customerSearch', { searchTerm }] as const,
  factorySearch: (searchTerm: string) =>
    [...orderQueryKeys.all, 'factorySearch', { searchTerm }] as const,
  userSearch: (searchTerm: string, isInside?: boolean, isOutside?: boolean) =>
    [...orderQueryKeys.all, 'userSearch', { searchTerm, isInside, isOutside }] as const,
  jobSearch: (searchTerm: string) =>
    [...orderQueryKeys.all, 'jobSearch', { searchTerm }] as const,
  productSearch: (searchTerm: string, factoryId?: string) =>
    [...orderQueryKeys.all, 'productSearch', { searchTerm, factoryId }] as const,
};

// ============================================================================
// Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch orders with infinite scroll
 */
export function useOrdersInfinite(
  filters?: OrderLandingPageFilter[],
  orderBy?: OrderLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedOrdersResult, Error>({
    queryKey: [...orderQueryKeys.orderLandingPages(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchOrdersWithPagination(filters, orderBy, {
        limit: pageSize,
        offset: pageParam as number,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all orders (non-paginated, up to 1000)
 */
export function useOrders(
  filters?: OrderLandingPageFilter[],
  orderBy?: OrderLandingPageOrderBy[]
) {
  return useQuery<OrderLandingPage[], Error>({
    queryKey: orderQueryKeys.orderLandingPages(filters, orderBy),
    queryFn: async () => {
      const result = await fetchOrdersWithPagination(filters, orderBy, { limit: 1000, offset: 0 });
      return result.records;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single order by ID for detail page
 */
export function useOrder(id: string | null) {
  return useQuery<Order | null, Error>({
    queryKey: orderQueryKeys.order(id || ''),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new order mutation
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, CreateOrderInput>({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
  });
}

/**
 * Update existing order mutation
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, UpdateOrderInput>({
    mutationFn: updateOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.order(data.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
  });
}

/**
 * Delete order mutation
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
  });
}

// ============================================================================
// Search Hooks (Trigger-based for dropdowns)
// ============================================================================

/**
 * Search customers for dropdowns
 * When searchTerm is empty, returns initial customer list
 */
export function useCustomerSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: orderQueryKeys.customerSearch(searchTerm || ''),
    queryFn: () => searchCustomers(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search factories for dropdowns
 * When searchTerm is empty, returns initial factory list
 */
export function useFactorySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: orderQueryKeys.factorySearch(searchTerm || ''),
    queryFn: () => searchFactories(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search users for inside/outside reps
 * When searchTerm is empty, returns initial user list
 * @param searchTerm - search term for filtering users
 * @param options - optional filters: isInside (for inside reps), isOutside (for outside reps)
 * @param enabled - whether the query is enabled
 */
export function useUserSearch(
  searchTerm: string,
  options?: { isInside?: boolean; isOutside?: boolean },
  enabled: boolean = true
) {
  // Only pass the flag that is explicitly true, never both
  const isInside = options?.isInside === true ? true : undefined;
  const isOutside = options?.isOutside === true ? true : undefined;

  return useQuery<UserSearchResult[], Error>({
    queryKey: orderQueryKeys.userSearch(searchTerm || '', isInside, isOutside),
    queryFn: () => searchUsers({ searchTerm: searchTerm || '', isInside, isOutside, enabled: true, limit: 50 }),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search jobs for dropdown selection
 * Used to link orders to jobs
 */
export function useJobSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<JobSearchResult[], Error>({
    queryKey: orderQueryKeys.jobSearch(searchTerm || ''),
    queryFn: () => searchJobs(searchTerm || '', 50),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search products for line items
 */
export function useProductSearch(searchTerm: string, factoryId?: string, enabled: boolean = true) {
  return useQuery<ProductSearchResult[], Error>({
    queryKey: orderQueryKeys.productSearch(searchTerm || '', factoryId),
    queryFn: () => searchProducts(searchTerm || '', factoryId, 50),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * List customer part numbers (CPNs) for a product
 * Used in line items to select customer part numbers
 */
export function useProductCpns(productId: string, enabled: boolean = true) {
  return useQuery<ProductCpnResult[], Error>({
    queryKey: [...orderQueryKeys.all, 'productCpns', { productId }] as const,
    queryFn: () => listProductCpns(productId),
    enabled: enabled && !!productId,
    staleTime: 30 * 1000,
  });
}

/**
 * List UOMs (Unit of Measure) for a product
 * Used in line items to select unit of measure
 */
export function useProductUoms(productId?: string, enabled: boolean = true) {
  return useQuery<ProductUomResult[], Error>({
    queryKey: [...orderQueryKeys.all, 'productUoms', { productId }] as const,
    queryFn: () => listProductUoms(productId),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Order,
  OrderLandingPage,
  OrderBalance,
  OrderCustomer,
  OrderCreatedBy,
  OrderSplitRate,
  OrderDetail,
  OrderInsideRep,
  OrderJob,
  OrderType,
  OrderCreationType,
  OrderHeaderStatus,
  OrderDetailStatus,
  OrderProduct,
  OrderUom,
  CreateOrderInput,
  UpdateOrderInput,
  OrderDetailInput,
  OrderSplitRateInput,
  OrderLandingPageFilter,
  OrderLandingPageOrderBy,
  PaginatedOrdersResult,
} from './ordersApi';

// Re-export search types from quotes API
export type {
  CustomerSearchResult,
  FactorySearchResult,
  UserSearchResult,
  ProductSearchResult,
  ProductCpnResult,
  ProductUomResult,
} from '@/components/quotes/api/quotesApi';

// Re-export job search type from central API
export type { JobSearchResult } from '@/components/lib/api/search';

// Re-export search functions from quotes API
export { searchCustomers, searchFactories, searchUsers, searchProducts, listProductCpns, listProductUoms } from '@/components/quotes/api/quotesApi';

// Re-export job search from central API
export { searchJobs } from '@/components/lib/api/search';
