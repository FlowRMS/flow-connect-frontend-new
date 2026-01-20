/**
 * React Query Hooks for Statements API
 * Provides data fetching, caching, and mutation hooks for statements
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchStatementsWithPagination,
  fetchStatementById,
  searchStatements,
  createStatement,
  updateStatement,
  deleteStatement,
  type Statement,
  type StatementLandingPage,
  type StatementLandingPageFilter,
  type StatementLandingPageOrderBy,
  type CreateStatementInput,
  type UpdateStatementInput,
  type PaginatedStatementsResult,
} from './statementsApi';
// Import search functions from quotes API (same as orders uses)
import {
  searchCustomers,
  searchFactories,
  searchUsers,
  searchProducts,
  listProductCpns,
  getProductCpnByCustomer,
  listProductUoms,
  listProductPricingTiers,
  type CustomerSearchResult,
  type FactorySearchResult,
  type UserSearchResult,
  type ProductSearchResult,
  type ProductCpnResult,
  type ProductUomResult,
  type ProductPricingTierResult,
} from '@/components/quotes/api/quotesApi';

// Re-export types for convenience
export * from './statementsApi';

// Re-export search types from quotes API
export type {
  CustomerSearchResult,
  FactorySearchResult,
  UserSearchResult,
  ProductSearchResult,
  ProductCpnResult,
  ProductUomResult,
  ProductPricingTierResult,
};

// Re-export search functions
export {
  searchCustomers,
  searchFactories,
  searchUsers,
  searchProducts,
  listProductCpns,
  getProductCpnByCustomer,
  listProductUoms,
  listProductPricingTiers,
};

// Query keys
export const statementQueryKeys = {
  all: ['statements'] as const,
  statements: () => [...statementQueryKeys.all, 'list'] as const,
  statement: (id: string) => [...statementQueryKeys.all, 'detail', id] as const,
  statementSearch: (searchTerm: string) => [...statementQueryKeys.all, 'search', searchTerm] as const,
  // Search keys
  customerSearch: (searchTerm: string) => [...statementQueryKeys.all, 'customerSearch', { searchTerm }] as const,
  factorySearch: (searchTerm: string) => [...statementQueryKeys.all, 'factorySearch', { searchTerm }] as const,
  userSearch: (searchTerm: string, isInside?: boolean, isOutside?: boolean) =>
    [...statementQueryKeys.all, 'userSearch', { searchTerm, isInside, isOutside }] as const,
  productSearch: (searchTerm: string, factoryId?: string) =>
    [...statementQueryKeys.all, 'productSearch', { searchTerm, factoryId }] as const,
};

/**
 * Hook to fetch paginated statements with infinite scroll support
 */
export function useStatementsInfinite(
  filters?: StatementLandingPageFilter[],
  orderBy?: StatementLandingPageOrderBy[],
  pageSize: number = 50
) {
  return useInfiniteQuery({
    queryKey: [...statementQueryKeys.statements(), { filters, orderBy }],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchStatementsWithPagination(filters, orderBy, {
        limit: pageSize,
        offset: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (loadedCount >= lastPage.total) {
        return undefined;
      }
      return loadedCount;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook to fetch a single statement by ID
 */
export function useStatement(id: string | null) {
  return useQuery({
    queryKey: statementQueryKeys.statement(id || ''),
    queryFn: () => fetchStatementById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to search statements
 */
export function useStatementSearch(
  searchTerm: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: statementQueryKeys.statementSearch(searchTerm),
    queryFn: () => searchStatements(searchTerm, 20),
    enabled: enabled && searchTerm.length >= 2,
  });
}

/**
 * Hook to create a statement
 */
export function useCreateStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStatementInput) => createStatement(input),
    onSuccess: () => {
      // Invalidate statement lists to refetch
      queryClient.invalidateQueries({ queryKey: statementQueryKeys.statements() });
    },
  });
}

/**
 * Hook to update a statement
 */
export function useUpdateStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStatementInput) => updateStatement(input),
    onSuccess: (data, variables) => {
      // Update the cache for this specific statement
      if (variables.id) {
        queryClient.setQueryData(statementQueryKeys.statement(variables.id), data);
      }
      // Invalidate statement lists to refetch
      queryClient.invalidateQueries({ queryKey: statementQueryKeys.statements() });
    },
  });
}

/**
 * Hook to delete a statement
 */
export function useDeleteStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStatement(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: statementQueryKeys.statement(id) });
      // Invalidate statement lists to refetch
      queryClient.invalidateQueries({ queryKey: statementQueryKeys.statements() });
    },
  });
}

// ============================================================================
// Search Hooks (same pattern as Orders)
// ============================================================================

/**
 * Search customers for dropdowns
 * When searchTerm is empty, returns initial customer list (no minimum character requirement)
 */
export function useCustomerSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: statementQueryKeys.customerSearch(searchTerm || ''),
    queryFn: () => searchCustomers(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search factories for dropdowns
 * When searchTerm is empty, returns initial factory list (no minimum character requirement)
 */
export function useFactorySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: statementQueryKeys.factorySearch(searchTerm || ''),
    queryFn: () => searchFactories(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search users for inside/outside reps
 * When searchTerm is empty, returns initial user list (no minimum character requirement)
 */
export function useUserSearch(
  searchTerm: string,
  options?: { isInside?: boolean; isOutside?: boolean },
  enabled: boolean = true
) {
  const isInside = options?.isInside === true ? true : undefined;
  const isOutside = options?.isOutside === true ? true : undefined;

  return useQuery<UserSearchResult[], Error>({
    queryKey: statementQueryKeys.userSearch(searchTerm || '', isInside, isOutside),
    queryFn: () => searchUsers({ searchTerm: searchTerm || '', isInside, isOutside, enabled: true, limit: 50 }),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search products for line items
 * When searchTerm is empty, returns initial product list (no minimum character requirement)
 */
export function useProductSearch(searchTerm: string, factoryId?: string, enabled: boolean = true) {
  return useQuery<ProductSearchResult[], Error>({
    queryKey: statementQueryKeys.productSearch(searchTerm || '', factoryId),
    queryFn: () => searchProducts(searchTerm || '', factoryId, 50),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * List customer part numbers (CPNs) for a product
 */
export function useProductCpns(productId: string, enabled: boolean = true) {
  return useQuery<ProductCpnResult[], Error>({
    queryKey: [...statementQueryKeys.all, 'productCpns', { productId }] as const,
    queryFn: () => listProductCpns(productId),
    enabled: enabled && !!productId,
    staleTime: 30 * 1000,
  });
}

/**
 * List all UOMs (Unit of Measure)
 */
export function useProductUoms(_productId?: string, enabled: boolean = true) {
  return useQuery<ProductUomResult[], Error>({
    queryKey: [...statementQueryKeys.all, 'productUoms'] as const,
    queryFn: () => listProductUoms(),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Order/Invoice Search Hooks (for linking statements to orders/invoices)
// ============================================================================

// Import order and invoice functions
import {
  fetchOrdersWithPagination,
  fetchOrderById,
  type OrderLandingPage,
  type Order,
  type OrderDetail,
  type OrderLandingPageFilter,
} from '@/components/lib/graphql/orders';
import {
  searchInvoices,
  type Invoice,
} from '@/components/lib/graphql/invoices';

// Re-export types for convenience
export type { OrderLandingPage, Invoice };

/**
 * Search orders for dropdowns
 */
export function useOrderSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<OrderLandingPage[], Error>({
    queryKey: [...statementQueryKeys.all, 'orderSearch', { searchTerm }] as const,
    queryFn: async () => {
      const filters: OrderLandingPageFilter[] = searchTerm
        ? [{ columnName: 'orderNumber', operator: 'CONTAINS', value: searchTerm }]
        : [];
      const result = await fetchOrdersWithPagination(filters, undefined, { limit: 50 });
      return result.records;
    },
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search invoices for dropdowns
 * Uses invoiceSearch API when there's a search term, otherwise fetches recent invoices via landing pages
 */
export function useInvoiceSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<Invoice[], Error>({
    queryKey: [...statementQueryKeys.all, 'invoiceSearch', { searchTerm }] as const,
    queryFn: async () => {
      if (searchTerm && searchTerm.trim().length > 0) {
        // Use search API when there's a search term
        return searchInvoices(searchTerm, 50);
      } else {
        // Fetch recent invoices via landing pages when no search term
        const { fetchInvoicesWithPagination } = await import('@/components/lib/graphql/invoices');
        const result = await fetchInvoicesWithPagination(undefined, [{ columnName: 'createdAt', direction: 'DESC' }], { limit: 50 });
        // Convert landing page results to Invoice-like objects for dropdown compatibility
        return result.records.map(r => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          entityDate: r.entityDate,
          orderId: r.orderId,
          order: r.orderNumber ? { id: r.orderId || '', orderNumber: r.orderNumber } : undefined,
        })) as Invoice[];
      }
    },
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}
