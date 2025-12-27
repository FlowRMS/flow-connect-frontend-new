/**
 * Quotes React Query Hooks
 * Custom hooks for interacting with the Quotes GraphQL API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  // Types
  type Quote,
  type QuoteLandingPage,
  type QuoteLandingPageFilter,
  type QuoteLandingPageOrderBy,
  type PaginatedQuotesResult,
  type CreateQuoteInput,
  type UpdateQuoteInput,
  type CustomerSearchResult,
  type ProductSearchResult,
  type FactorySearchResult,
  type UserSearchResult,
  type ProductCpnResult,
  type ProductUomResult,
  // API Functions
  fetchQuotesWithPagination,
  fetchQuoteById,
  createQuote,
  updateQuote,
  duplicateQuote,
  deleteQuote,
  createQuoteFromPreOpportunity,
  searchCustomers,
  searchProducts,
  searchFactories,
  searchUsers,
  listProductCpns,
  listProductUoms,
} from './quotesApi';

// ============================================================================
// Query Keys
// ============================================================================

export const quoteQueryKeys = {
  all: ['quotes'] as const,

  // Quotes
  quotes: () => [...quoteQueryKeys.all, 'list'] as const,
  quoteLandingPages: (filters?: QuoteLandingPageFilter[], orderBy?: QuoteLandingPageOrderBy[]) =>
    [...quoteQueryKeys.all, 'landingPages', { filters, orderBy }] as const,
  quote: (id: string) => [...quoteQueryKeys.all, 'detail', id] as const,

  // Search
  customerSearch: (searchTerm: string) =>
    [...quoteQueryKeys.all, 'customerSearch', { searchTerm }] as const,
  productSearch: (searchTerm: string, factoryId?: string) =>
    [...quoteQueryKeys.all, 'productSearch', { searchTerm, factoryId }] as const,
  factorySearch: (searchTerm: string) =>
    [...quoteQueryKeys.all, 'factorySearch', { searchTerm }] as const,
  userSearch: (searchTerm: string, isInside?: boolean) =>
    [...quoteQueryKeys.all, 'userSearch', { searchTerm, isInside }] as const,
  productCpns: (productId: string) =>
    [...quoteQueryKeys.all, 'productCpns', { productId }] as const,
  productUoms: (productId?: string) =>
    [...quoteQueryKeys.all, 'productUoms', { productId }] as const,
};

// ============================================================================
// Quote Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch quote landing pages with infinite scroll pagination
 */
export function useQuotesInfinite(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedQuotesResult, Error>({
    queryKey: [...quoteQueryKeys.quoteLandingPages(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchQuotesWithPagination(filters, orderBy, {
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
 * Fetch quote landing pages (non-paginated)
 */
export function useQuotes(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[]
) {
  return useQuery<QuoteLandingPage[], Error>({
    queryKey: quoteQueryKeys.quoteLandingPages(filters, orderBy),
    queryFn: async () => {
      const result = await fetchQuotesWithPagination(filters, orderBy, { limit: 1000, offset: 0 });
      return result.records;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single quote by ID
 */
export function useQuote(id: string) {
  return useQuery<Quote | null, Error>({
    queryKey: quoteQueryKeys.quote(id),
    queryFn: () => fetchQuoteById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new quote mutation
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, CreateQuoteInput>({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Update existing quote mutation
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, UpdateQuoteInput>({
    mutationFn: updateQuote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quote(data.id) });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Duplicate quote mutation
 */
export function useDuplicateQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, { sourceQuoteId: string; newQuoteNumber: string }>({
    mutationFn: ({ sourceQuoteId, newQuoteNumber }) => duplicateQuote(sourceQuoteId, newQuoteNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Delete quote mutation
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Create quote from pre-opportunity mutation
 */
export function useCreateQuoteFromPreOpportunity() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, { preOpportunityId: string; quoteNumber: string }>({
    mutationFn: ({ preOpportunityId, quoteNumber }) =>
      createQuoteFromPreOpportunity(preOpportunityId, quoteNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
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
    queryKey: quoteQueryKeys.customerSearch(searchTerm || ''),
    queryFn: () => searchCustomers(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search products for line items
 * When searchTerm is empty, returns initial product list
 */
export function useProductSearch(searchTerm: string, factoryId?: string, enabled: boolean = true) {
  return useQuery<ProductSearchResult[], Error>({
    queryKey: quoteQueryKeys.productSearch(searchTerm || '', factoryId),
    queryFn: () => searchProducts(searchTerm || '', factoryId, 50),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search factories for line items
 * When searchTerm is empty, returns initial factory list
 */
export function useFactorySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: quoteQueryKeys.factorySearch(searchTerm || ''),
    queryFn: () => searchFactories(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Search users for inside reps and split rates
 * When searchTerm is empty, returns initial user list
 */
export function useUserSearch(searchTerm: string, isInside?: boolean, enabled: boolean = true) {
  return useQuery<UserSearchResult[], Error>({
    queryKey: quoteQueryKeys.userSearch(searchTerm || '', isInside),
    queryFn: () => searchUsers({ searchTerm: searchTerm || '', isInside, enabled: true, limit: 20 }),
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
    queryKey: quoteQueryKeys.productCpns(productId),
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
    queryKey: quoteQueryKeys.productUoms(productId),
    queryFn: () => listProductUoms(productId),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Quote,
  QuoteLandingPage,
  QuoteBalance,
  QuoteCustomer,
  QuoteCreatedBy,
  QuoteSplitRate,
  QuoteDetail,
  QuoteInsideRep,
  QuoteStatus,
  QuotePipelineStage,
  QuoteCreationType,
  QuoteDetailStatus,
  QuoteProduct,
  QuoteUom,
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteDetailInput,
  QuoteSplitRateInput,
  QuoteLandingPageFilter,
  QuoteLandingPageOrderBy,
  PaginatedQuotesResult,
  CustomerSearchResult,
  ProductSearchResult,
  FactorySearchResult,
  UserSearchResult,
  ProductCpnResult,
  ProductUomResult,
} from './quotesApi';

// Re-export API functions for convenience
export { searchUsers, searchProducts, searchCustomers, searchFactories, listProductCpns, listProductUoms } from './quotesApi';
