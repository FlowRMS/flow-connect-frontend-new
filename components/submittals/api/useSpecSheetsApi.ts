/**
 * Spec Sheets API React Query Hooks
 * Provides hooks for fetching and mutating spec sheets data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSpecSheet,
  fetchSpecSheetsByFactory,
  searchSpecSheets,
  fetchHighlightVersions,
  fetchHighlightVersion,
  createSpecSheet,
  updateSpecSheet,
  deleteSpecSheet,
  createHighlightVersion,
  updateHighlightRegions,
  deleteHighlightVersion,
  moveFolder,
  type SpecSheetResponse,
  type HighlightVersionResponse,
  type CreateSpecSheetInput,
  type UpdateSpecSheetInput,
  type CreateHighlightVersionInput,
  type HighlightRegionInput,
} from '@/components/lib/graphql/spec-sheets';

// ============================================================================
// Query Keys
// ============================================================================

export const specSheetQueryKeys = {
  all: ['specSheets'] as const,
  list: () => [...specSheetQueryKeys.all, 'list'] as const,
  byFactory: (factoryId: string, publishedOnly?: boolean) =>
    [...specSheetQueryKeys.all, 'byFactory', { factoryId, publishedOnly }] as const,
  search: (params: { searchTerm?: string; factoryId?: string; categories?: string[]; publishedOnly?: boolean }) =>
    [...specSheetQueryKeys.all, 'search', params] as const,
  detail: (id: string) => [...specSheetQueryKeys.all, 'detail', id] as const,
  // Highlight versions
  highlightVersions: (specSheetId: string) =>
    [...specSheetQueryKeys.all, 'highlightVersions', { specSheetId }] as const,
  highlightVersion: (id: string) =>
    [...specSheetQueryKeys.all, 'highlightVersion', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single spec sheet by ID
 */
export function useSpecSheet(id: string | null) {
  return useQuery<SpecSheetResponse | null, Error>({
    queryKey: specSheetQueryKeys.detail(id || ''),
    queryFn: () => fetchSpecSheet(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch spec sheets by factory
 */
export function useSpecSheetsByFactory(factoryId: string | null, publishedOnly: boolean = true) {
  return useQuery<SpecSheetResponse[], Error>({
    queryKey: specSheetQueryKeys.byFactory(factoryId || '', publishedOnly),
    queryFn: () => fetchSpecSheetsByFactory(factoryId!, publishedOnly),
    enabled: !!factoryId,
    staleTime: 30 * 1000,
  });
}

/**
 * Search spec sheets with filters
 */
export function useSpecSheetSearch(params: {
  searchTerm?: string;
  factoryId?: string;
  categories?: string[];
  publishedOnly?: boolean;
  limit?: number;
}, enabled: boolean = true) {
  return useQuery<SpecSheetResponse[], Error>({
    queryKey: specSheetQueryKeys.search(params),
    queryFn: () => searchSpecSheets(params),
    enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch highlight versions for a spec sheet
 */
export function useHighlightVersions(specSheetId: string | null) {
  return useQuery<HighlightVersionResponse[], Error>({
    queryKey: specSheetQueryKeys.highlightVersions(specSheetId || ''),
    queryFn: () => fetchHighlightVersions(specSheetId!),
    enabled: !!specSheetId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single highlight version by ID
 */
export function useHighlightVersion(id: string | null) {
  return useQuery<HighlightVersionResponse | null, Error>({
    queryKey: specSheetQueryKeys.highlightVersion(id || ''),
    queryFn: () => fetchHighlightVersion(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new spec sheet
 */
export function useCreateSpecSheet() {
  const queryClient = useQueryClient();

  return useMutation<SpecSheetResponse, Error, CreateSpecSheetInput>({
    mutationFn: createSpecSheet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(data.factoryId) });
    },
  });
}

/**
 * Update an existing spec sheet
 */
export function useUpdateSpecSheet() {
  const queryClient = useQueryClient();

  return useMutation<SpecSheetResponse, Error, { id: string; input: UpdateSpecSheetInput }>({
    mutationFn: ({ id, input }) => updateSpecSheet(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(data.factoryId) });
    },
  });
}

/**
 * Delete a spec sheet
 */
export function useDeleteSpecSheet() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteSpecSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
    },
  });
}

/**
 * Create a new highlight version
 */
export function useCreateHighlightVersion() {
  const queryClient = useQueryClient();

  return useMutation<HighlightVersionResponse, Error, CreateHighlightVersionInput>({
    mutationFn: createHighlightVersion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersions(data.specSheetId)
      });
    },
  });
}

/**
 * Update highlight regions in a version
 */
export function useUpdateHighlightRegions() {
  const queryClient = useQueryClient();

  return useMutation<HighlightVersionResponse, Error, { versionId: string; regions: HighlightRegionInput[] }>({
    mutationFn: ({ versionId, regions }) => updateHighlightRegions(versionId, regions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersion(data.id)
      });
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersions(data.specSheetId)
      });
    },
  });
}

/**
 * Delete a highlight version
 */
export function useDeleteHighlightVersion() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; specSheetId: string }>({
    mutationFn: ({ id }) => deleteHighlightVersion(id),
    onSuccess: (_, { specSheetId }) => {
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersions(specSheetId)
      });
    },
  });
}

/**
 * Move spec sheets between folders
 */
export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, { factoryId: string; oldFolderPath: string; newFolderPath: string }>({
    mutationFn: ({ factoryId, oldFolderPath, newFolderPath }) =>
      moveFolder(factoryId, oldFolderPath, newFolderPath),
    onSuccess: (_, { factoryId }) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(factoryId) });
    },
  });
}

// ============================================================================
// Re-export types
// ============================================================================

export type {
  SpecSheetResponse,
  HighlightVersionResponse,
  HighlightRegionResponse,
  CreateSpecSheetInput,
  UpdateSpecSheetInput,
  CreateHighlightVersionInput,
  HighlightRegionInput,
} from '@/components/lib/graphql/spec-sheets';
