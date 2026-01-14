/**
 * React Query Hooks for Invoices API
 * Provides data fetching, caching, and mutation hooks for invoices
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvoicesWithPagination,
  fetchInvoiceById,
  searchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createInvoiceFromOrder,
  type Invoice,
  type InvoiceLandingPage,
  type InvoiceLandingPageFilter,
  type InvoiceLandingPageOrderBy,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type CreateInvoiceFromOrderInput,
  type PaginatedInvoicesResult,
  type InvoiceSearchOptions,
} from './invoicesApi';

// Re-export types for convenience
export * from './invoicesApi';

// Query keys
export const invoiceQueryKeys = {
  all: ['invoices'] as const,
  invoices: () => [...invoiceQueryKeys.all, 'list'] as const,
  invoice: (id: string) => [...invoiceQueryKeys.all, 'detail', id] as const,
  invoiceSearch: (searchTerm: string) => [...invoiceQueryKeys.all, 'search', searchTerm] as const,
};

/**
 * Hook to fetch paginated invoices with infinite scroll support
 */
export function useInvoicesInfinite(
  filters?: InvoiceLandingPageFilter[],
  orderBy?: InvoiceLandingPageOrderBy[],
  pageSize: number = 50
) {
  return useInfiniteQuery({
    queryKey: [...invoiceQueryKeys.invoices(), { filters, orderBy }],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchInvoicesWithPagination(filters, orderBy, {
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
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: invoiceQueryKeys.invoice(id || ''),
    queryFn: () => fetchInvoiceById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to search invoices
 */
export function useInvoiceSearch(
  searchTerm: string,
  enabled: boolean = true,
  options?: InvoiceSearchOptions
) {
  return useQuery({
    queryKey: [...invoiceQueryKeys.invoiceSearch(searchTerm), options],
    queryFn: () => searchInvoices(searchTerm, 20, options),
    enabled: enabled && searchTerm.length >= 2,
  });
}

/**
 * Hook to search invoices for checks page (openOnly and unlockedOnly = true)
 */
export function useInvoiceSearchForChecks(searchTerm: string, enabled: boolean = true) {
  return useInvoiceSearch(searchTerm, enabled, { openOnly: true, unlockedOnly: true });
}

/**
 * Hook to create an invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      // Invalidate invoice lists to refetch
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.invoices() });
    },
  });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) => updateInvoice(input),
    onSuccess: (data, variables) => {
      // Update the cache for this specific invoice
      queryClient.setQueryData(invoiceQueryKeys.invoice(variables.id!), data);
      // Invalidate invoice lists to refetch
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.invoices() });
    },
  });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: invoiceQueryKeys.invoice(id) });
      // Invalidate invoice lists to refetch
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.invoices() });
    },
  });
}

/**
 * Hook to create an invoice from an order
 */
export function useCreateInvoiceFromOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceFromOrderInput) => createInvoiceFromOrder(input),
    onSuccess: () => {
      // Invalidate invoice lists to refetch
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.all });
      // Also invalidate orders since the order may have been updated
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
