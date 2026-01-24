/**
 * React Query hooks for Alias Management
 * Provides hooks for fetching, creating, and deleting entity aliases
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAliasesByEntity,
  searchAliases,
  createAlias,
  updateAlias,
  deleteAlias,
  type Alias,
  type AliasEntityType,
  type AliasSubType,
  type CreateAliasInput,
  type UpdateAliasInput,
  type AliasSearchParams,
} from '@/components/lib/graphql/aliases';

// Re-export types for convenience
export type { Alias, AliasEntityType, AliasSubType, CreateAliasInput, UpdateAliasInput };

// ============================================================================
// Query Keys
// ============================================================================

export const aliasQueryKeys = {
  all: ['aliases'] as const,
  byEntity: (entityId: string, entityType: AliasEntityType, subType?: AliasSubType) =>
    [...aliasQueryKeys.all, 'byEntity', entityId, entityType, subType] as const,
  search: (params: AliasSearchParams) =>
    [...aliasQueryKeys.all, 'search', params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all aliases for a specific entity
 */
export function useAliasesByEntity(
  entityId: string | undefined,
  entityType: AliasEntityType,
  subType?: AliasSubType
) {
  return useQuery<Alias[], Error>({
    queryKey: aliasQueryKeys.byEntity(entityId || '', entityType, subType),
    queryFn: () => fetchAliasesByEntity(entityId!, entityType, subType),
    enabled: !!entityId,
    staleTime: 30 * 1000,
  });
}

/**
 * Search aliases across entities
 */
export function useAliasSearch(
  params: AliasSearchParams,
  enabled: boolean = true
) {
  return useQuery<Alias[], Error>({
    queryKey: aliasQueryKeys.search(params),
    queryFn: () => searchAliases(params),
    enabled: enabled && !!params.searchTerm,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new alias
 */
export function useCreateAlias() {
  const queryClient = useQueryClient();

  return useMutation<Alias, Error, CreateAliasInput>({
    mutationFn: createAlias,
    onSuccess: (newAlias) => {
      // Invalidate the aliases list for this entity
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(newAlias.entityId, newAlias.entityType, newAlias.subType),
      });
      // Also invalidate the general entity aliases (without subType filter)
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(newAlias.entityId, newAlias.entityType),
      });
    },
  });
}

/**
 * Update an existing alias
 */
export function useUpdateAlias() {
  const queryClient = useQueryClient();

  return useMutation<Alias, Error, UpdateAliasInput>({
    mutationFn: (input) => updateAlias(input),
    onSuccess: (updatedAlias) => {
      // Invalidate the aliases list for this entity
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(updatedAlias.entityId, updatedAlias.entityType, updatedAlias.subType),
      });
      // Also invalidate the general entity aliases (without subType filter)
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(updatedAlias.entityId, updatedAlias.entityType),
      });
    },
  });
}

/**
 * Delete an alias
 */
export function useDeleteAlias() {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    Error,
    { id: string; entityId: string; entityType: AliasEntityType; subType?: AliasSubType }
  >({
    mutationFn: ({ id }) => deleteAlias(id),
    onSuccess: (_, variables) => {
      // Invalidate the aliases list for this entity
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(variables.entityId, variables.entityType, variables.subType),
      });
      // Also invalidate the general entity aliases (without subType filter)
      queryClient.invalidateQueries({
        queryKey: aliasQueryKeys.byEntity(variables.entityId, variables.entityType),
      });
    },
  });
}
