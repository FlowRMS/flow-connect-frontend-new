'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTerritory,
  fetchTerritoriesByType,
  fetchTerritoryChildren,
  fetchTerritoryHierarchy,
  fetchAllTerritories,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  assignTerritoryManager,
  removeTerritoryManager,
  type Territory,
  type TerritoryLite,
  type TerritoryType,
  type TerritoryInput,
} from '../../lib/graphql/territories';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

// =============================================================================
// Query Keys
// =============================================================================

export const territoryKeys = {
  all: ['territories'] as const,
  lists: () => [...territoryKeys.all, 'list'] as const,
  list: (filters: { type?: TerritoryType; activeOnly?: boolean }) =>
    [...territoryKeys.lists(), filters] as const,
  details: () => [...territoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...territoryKeys.details(), id] as const,
  children: (parentId: string) => [...territoryKeys.all, 'children', parentId] as const,
  hierarchy: (id: string) => [...territoryKeys.all, 'hierarchy', id] as const,
};

// =============================================================================
// Queries
// =============================================================================

export function useTerritory(id: string | null | undefined) {
  return useQuery({
    queryKey: territoryKeys.detail(id || ''),
    queryFn: () => fetchTerritory(id!),
    enabled: !!id,
  });
}

export function useTerritoriesByType(
  territoryType: TerritoryType,
  activeOnly: boolean = true
) {
  return useQuery({
    queryKey: territoryKeys.list({ type: territoryType, activeOnly }),
    queryFn: () => fetchTerritoriesByType(territoryType, activeOnly),
  });
}

export function useTerritoryChildren(parentId: string | null | undefined) {
  return useQuery({
    queryKey: territoryKeys.children(parentId || ''),
    queryFn: () => fetchTerritoryChildren(parentId!),
    enabled: !!parentId,
  });
}

export function useTerritoryHierarchy(territoryId: string | null | undefined) {
  return useQuery({
    queryKey: territoryKeys.hierarchy(territoryId || ''),
    queryFn: () => fetchTerritoryHierarchy(territoryId!),
    enabled: !!territoryId,
  });
}

export function useAllTerritories() {
  return useQuery({
    queryKey: territoryKeys.lists(),
    queryFn: fetchAllTerritories,
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useCreateTerritory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TerritoryInput) => createTerritory(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: territoryKeys.all });
      showSuccessToast(`Territory "${data.name}" created successfully`);
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to create territory');
    },
  });
}

export function useUpdateTerritory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TerritoryInput }) =>
      updateTerritory(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: territoryKeys.all });
      showSuccessToast(`Territory "${data.name}" updated successfully`);
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to update territory');
    },
  });
}

export function useDeleteTerritory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTerritory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: territoryKeys.all });
      showSuccessToast('Territory deleted successfully');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to delete territory');
    },
  });
}

export function useAssignTerritoryManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ territoryId, userId }: { territoryId: string; userId: string }) =>
      assignTerritoryManager(territoryId, userId),
    onSuccess: (data) => {
      console.log('Territory manager assigned successfully:', data);
      queryClient.invalidateQueries({ queryKey: territoryKeys.all });
      showSuccessToast('Manager assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to assign territory manager:', error);
      showErrorToast(error.message || 'Failed to assign manager');
    },
  });
}

export function useRemoveTerritoryManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ territoryId, userId }: { territoryId: string; userId: string }) =>
      removeTerritoryManager(territoryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: territoryKeys.all });
      showSuccessToast('Manager removed successfully');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to remove manager');
    },
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

export interface TerritoryTreeNode extends TerritoryLite {
  children?: TerritoryTreeNode[];
  splitRates?: Territory['splitRates'];
  managers?: Territory['managers'];
}

export function useTerritoryTree() {
  const regionsQuery = useTerritoriesByType('REGION');
  const subregionsQuery = useTerritoriesByType('SUBREGION');
  const territoriesQuery = useTerritoriesByType('TERRITORY');

  const isLoading =
    regionsQuery.isLoading || subregionsQuery.isLoading || territoriesQuery.isLoading;
  const isError =
    regionsQuery.isError || subregionsQuery.isError || territoriesQuery.isError;

  const tree: TerritoryTreeNode[] = [];

  if (!isLoading && !isError) {
    const regions = regionsQuery.data || [];
    const subregions = subregionsQuery.data || [];
    const territories = territoriesQuery.data || [];

    // Build tree structure
    regions.forEach((region) => {
      const regionNode: TerritoryTreeNode = {
        ...region,
        children: [],
      };

      subregions
        .filter((sr) => sr.parentId === region.id)
        .forEach((subregion) => {
          const subregionNode: TerritoryTreeNode = {
            ...subregion,
            children: territories.filter((t) => t.parentId === subregion.id),
          };
          regionNode.children!.push(subregionNode);
        });

      tree.push(regionNode);
    });
  }

  return {
    tree,
    isLoading,
    isError,
    refetch: () => {
      regionsQuery.refetch();
      subregionsQuery.refetch();
      territoriesQuery.refetch();
    },
  };
}
