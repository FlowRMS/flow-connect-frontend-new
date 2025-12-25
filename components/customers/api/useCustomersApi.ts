/**
 * Customers React Query Hooks
 * Custom hooks for interacting with the Customers GraphQL API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import {
  fetchCustomers,
  fetchCustomersWithPagination,
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CustomerLandingPage,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type PaginatedCustomersResult,
  type CustomerLandingPageFilter,
  type CustomerLandingPageOrderBy,
} from './customersApi';

// ============================================================================
// Query Keys
// ============================================================================

export const customersQueryKeys = {
  all: ['customers'] as const,
  list: (filters?: CustomerLandingPageFilter[], orderBy?: CustomerLandingPageOrderBy[]) =>
    [...customersQueryKeys.all, 'list', { filters, orderBy }] as const,
  detail: (id: string) => [...customersQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Customer Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch all customers using landing pages endpoint
 */
export function useCustomers() {
  return useQuery<CustomerLandingPage[], Error>({
    queryKey: customersQueryKeys.list(),
    queryFn: fetchCustomers,
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch customers with infinite scroll pagination and optional server-side filters/sorting
 */
export function useCustomersInfinite(
  filters?: CustomerLandingPageFilter[],
  orderBy?: CustomerLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedCustomersResult, Error>({
    queryKey: [...customersQueryKeys.list(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchCustomersWithPagination(filters, orderBy, { limit: pageSize, offset: pageParam as number });
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
 * Fetch a single customer by ID
 */
export function useCustomer(customerId: string) {
  return useQuery<Customer | null, Error>({
    queryKey: customersQueryKeys.detail(customerId),
    queryFn: () => fetchCustomerById(customerId),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, CreateCustomerInput>({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.all });
    },
  });
}

/**
 * Update an existing customer with optimistic updates for instant UI feedback
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, { id: string; input: UpdateCustomerInput }, { previousData: unknown }>({
    mutationFn: ({ id, input }) => updateCustomer(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKeys.all });

      const queryCache = queryClient.getQueryCache();
      const matchingQueries = queryCache.findAll({
        queryKey: customersQueryKeys.all,
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'customers' && key.includes('list');
        },
      });

      const previousData: Record<string, unknown> = {};
      matchingQueries.forEach((query) => {
        previousData[JSON.stringify(query.queryKey)] = query.state.data;
      });

      const updateCustomerInList = (customer: CustomerLandingPage): CustomerLandingPage => {
        if (customer.id === id) {
          return {
            ...customer,
            companyName: input.companyName ?? customer.companyName,
            contactEmail: input.contactEmail ?? customer.contactEmail,
            contactNumber: input.contactNumber ?? customer.contactNumber,
            isParent: input.isParent ?? customer.isParent,
            published: input.published ?? customer.published,
          };
        }
        return customer;
      };

      matchingQueries.forEach((query) => {
        const data = query.state.data;

        if (data && typeof data === 'object' && 'pages' in data) {
          const infiniteData = data as { pages: Array<{ records: CustomerLandingPage[]; total: number }>; pageParams: unknown[] };
          queryClient.setQueryData(query.queryKey, {
            ...infiniteData,
            pages: infiniteData.pages.map(page => ({
              ...page,
              records: page.records.map(updateCustomerInList),
            })),
          });
        } else if (Array.isArray(data)) {
          queryClient.setQueryData(
            query.queryKey,
            (data as CustomerLandingPage[]).map(updateCustomerInList)
          );
        }
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        const previousData = context.previousData as Record<string, unknown>;
        Object.entries(previousData).forEach(([keyStr, data]) => {
          const queryKey = JSON.parse(keyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.list() });
    },
  });
}

// Re-export types
export type {
  Customer,
  CustomerLandingPage,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerLandingPageFilter,
  CustomerLandingPageOrderBy,
};
