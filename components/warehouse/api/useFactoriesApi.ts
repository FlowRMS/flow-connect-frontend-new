/**
 * Factories React Query Hooks
 * Custom hooks for interacting with the Factories GraphQL API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import {
  fetchFactories,
  fetchFactoriesWithPagination,
  fetchFactoryById,
  createFactory,
  updateFactory,
  deleteFactory,
  fetchFactoryChildren,
  assignChildFactories,
  type Factory,
  type FactoryLandingPage,
  type FactoryLiteResponse,
  type CreateFactoryInput,
  type UpdateFactoryInput,
  type PaginatedFactoriesResult,
  type FactoryLandingPageFilter,
  type FactoryLandingPageOrderBy,
} from './factoriesApi';

import { bulkDelete, type BulkDeleteResult } from '@/components/lib/graphql/bulk-operations';

// ============================================================================
// Query Keys
// ============================================================================

export const factoriesQueryKeys = {
  all: ['factories'] as const,
  list: (filters?: FactoryLandingPageFilter[], orderBy?: FactoryLandingPageOrderBy[]) =>
    [...factoriesQueryKeys.all, 'list', { filters, orderBy }] as const,
  detail: (id: string) => [...factoriesQueryKeys.all, 'detail', id] as const,
  children: (parentId: string) => [...factoriesQueryKeys.all, 'children', parentId] as const,
};

// ============================================================================
// Factory Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 200;

/**
 * Fetch all factories using landing pages endpoint
 */
export function useFactories() {
  return useQuery<FactoryLandingPage[], Error>({
    queryKey: factoriesQueryKeys.list(),
    queryFn: fetchFactories,
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch factories with infinite scroll pagination and optional server-side filters/sorting
 */
export function useFactoriesInfinite(
  filters?: FactoryLandingPageFilter[],
  orderBy?: FactoryLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedFactoriesResult, Error>({
    queryKey: [...factoriesQueryKeys.list(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchFactoriesWithPagination(filters, orderBy, { limit: pageSize, offset: pageParam as number });
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
 * Fetch a single factory by ID
 */
export function useFactory(factoryId: string) {
  return useQuery<Factory | null, Error>({
    queryKey: factoriesQueryKeys.detail(factoryId),
    queryFn: () => fetchFactoryById(factoryId),
    enabled: !!factoryId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new factory
 */
export function useCreateFactory() {
  const queryClient = useQueryClient();

  return useMutation<Factory, Error, CreateFactoryInput>({
    mutationFn: createFactory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.all });
    },
  });
}

/**
 * Update an existing factory with optimistic updates for instant UI feedback
 */
export function useUpdateFactory() {
  const queryClient = useQueryClient();

  return useMutation<Factory, Error, { id: string; input: UpdateFactoryInput }, { previousData: unknown }>({
    mutationFn: ({ id, input }) => updateFactory(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: factoriesQueryKeys.all });

      const queryCache = queryClient.getQueryCache();
      const matchingQueries = queryCache.findAll({
        queryKey: factoriesQueryKeys.all,
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'factories' && key.includes('list');
        },
      });

      const previousData: Record<string, unknown> = {};
      matchingQueries.forEach((query) => {
        previousData[JSON.stringify(query.queryKey)] = query.state.data;
      });

      const updateFactoryInList = (factory: FactoryLandingPage): FactoryLandingPage => {
        if (factory.id === id) {
          return {
            ...factory,
            title: input.title ?? factory.title,
            email: input.email ?? factory.email,
            phone: input.phone ?? factory.phone,
            published: input.published ?? factory.published,
            accountNumber: input.accountNumber ?? factory.accountNumber,
          };
        }
        return factory;
      };

      matchingQueries.forEach((query) => {
        const data = query.state.data;

        if (data && typeof data === 'object' && 'pages' in data) {
          const infiniteData = data as { pages: Array<{ records: FactoryLandingPage[]; total: number }>; pageParams: unknown[] };
          queryClient.setQueryData(query.queryKey, {
            ...infiniteData,
            pages: infiniteData.pages.map(page => ({
              ...page,
              records: page.records.map(updateFactoryInList),
            })),
          });
        } else if (Array.isArray(data)) {
          queryClient.setQueryData(
            query.queryKey,
            (data as FactoryLandingPage[]).map(updateFactoryInList)
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
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a factory
 */
export function useDeleteFactory() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteFactory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.list() });
    },
  });
}

/**
 * Bulk delete factories
 */
export function useBulkDeleteFactories() {
  const queryClient = useQueryClient();

  return useMutation<BulkDeleteResult, Error, string[]>({
    mutationFn: (entityIds) => bulkDelete(entityIds, 'FACTORIES'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.all });
    },
  });
}

/**
 * Fetch child factories for a given parent factory
 */
export function useFactoryChildren(parentId: string | undefined) {
  return useQuery<FactoryLiteResponse[], Error>({
    queryKey: factoriesQueryKeys.children(parentId || ''),
    queryFn: () => fetchFactoryChildren(parentId!),
    enabled: !!parentId,
    staleTime: 30 * 1000,
  });
}

/**
 * Assign child factories to a parent factory
 */
export function useAssignChildFactories() {
  const queryClient = useQueryClient();

  return useMutation<FactoryLiteResponse[], Error, { parentId: string; childIds: string[] }>({
    mutationFn: ({ parentId, childIds }) => assignChildFactories(parentId, childIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.children(variables.parentId) });
      queryClient.invalidateQueries({ queryKey: factoriesQueryKeys.all });
    },
  });
}

// Re-export types
export type {
  Factory,
  FactoryLandingPage,
  FactoryLiteResponse,
  CreateFactoryInput,
  UpdateFactoryInput,
  FactoryLandingPageFilter,
  FactoryLandingPageOrderBy,
};
