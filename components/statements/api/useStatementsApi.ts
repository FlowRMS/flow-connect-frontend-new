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

// Re-export types for convenience
export * from './statementsApi';

// Query keys
export const statementQueryKeys = {
  all: ['statements'] as const,
  statements: () => [...statementQueryKeys.all, 'list'] as const,
  statement: (id: string) => [...statementQueryKeys.all, 'detail', id] as const,
  statementSearch: (searchTerm: string) => [...statementQueryKeys.all, 'search', searchTerm] as const,
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
