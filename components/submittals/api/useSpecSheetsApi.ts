/**
 * Spec Sheets API React Query Hooks
 * Provides hooks for fetching and mutating spec sheets data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  renameHighlightVersion,
  moveFolder,
  moveSpecSheetToFolder,
  // Folder API functions
  fetchFoldersByFactory,
  createFolder,
  renameFolder,
  deleteFolder,
  type SpecSheetResponse,
  type HighlightVersionResponse,
  type CreateSpecSheetInput,
  type UpdateSpecSheetInput,
  type CreateHighlightVersionInput,
  type HighlightRegionInput,
  // Folder types
  type FolderResponse,
  type CreateFolderInput,
  type RenameFolderInput,
  type DeleteFolderInput,
  type MoveFolderInput,
  type MoveSpecSheetToFolderInput,
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
  // Folders
  folders: (factoryId: string) =>
    [...specSheetQueryKeys.all, 'folders', { factoryId }] as const,
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
      // Invalidate folders as well since the new spec sheet may create new folders
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
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
      // Invalidate folders as folder path may have changed
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
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
      // Invalidate all spec sheet queries (includes folders via prefix matching)
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
    onError: (error) => {
      // Check if error is due to foreign key constraint (highlight version in use)
      if (error.message?.includes('foreign key') || error.message?.includes('still referenced')) {
        toast.error('Cannot delete highlight version', {
          description: 'This highlight version is being used in one or more submittals. Remove it from all submittals first.',
        });
      } else {
        toast.error('Failed to delete highlight version', {
          description: error.message,
        });
      }
    },
  });
}

/**
 * Rename a highlight version
 */
export function useRenameHighlightVersion() {
  const queryClient = useQueryClient();

  return useMutation<HighlightVersionResponse, Error, { id: string; name: string; specSheetId: string }>({
    mutationFn: ({ id, name }) => renameHighlightVersion(id, name),
    onSuccess: (data, { specSheetId }) => {
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersion(data.id)
      });
      queryClient.invalidateQueries({
        queryKey: specSheetQueryKeys.highlightVersions(specSheetId)
      });
    },
  });
}

/**
 * Move a folder to a new parent
 */
export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error, MoveFolderInput>({
    mutationFn: moveFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
    },
  });
}

/**
 * Move a spec sheet to a folder
 */
export function useMoveSpecSheetToFolder() {
  const queryClient = useQueryClient();

  return useMutation<SpecSheetResponse, Error, MoveSpecSheetToFolderInput>({
    mutationFn: moveSpecSheetToFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(data.factoryId) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
    },
  });
}

// ============================================================================
// Folder Hooks
// ============================================================================

/**
 * Fetch folders for a factory
 */
export function useFoldersByFactory(factoryId: string | null) {
  return useQuery<FolderResponse[], Error>({
    queryKey: specSheetQueryKeys.folders(factoryId || ''),
    queryFn: () => fetchFoldersByFactory(factoryId!),
    enabled: !!factoryId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new folder
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error, CreateFolderInput>({
    mutationFn: createFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(data.factoryId) });
    },
  });
}

/**
 * Rename a folder
 */
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation<FolderResponse, Error, RenameFolderInput>({
    mutationFn: renameFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(data.factoryId) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(data.factoryId) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.all });
    },
  });
}

/**
 * Delete a folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteFolderInput>({
    mutationFn: deleteFolder,
    onSuccess: (_, { factoryId }) => {
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.folders(factoryId) });
      queryClient.invalidateQueries({ queryKey: specSheetQueryKeys.byFactory(factoryId) });
    },
  });
}

// ============================================================================
// Re-export Adapter Hooks
// ============================================================================

export {
  useSpecSheetsWithFactoryNames,
  useSpecSheetSearchWithFactoryNames,
  useManufacturersWithSpecSheets,
} from './useSpecSheetsAdapters';

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
  // Folder types
  FolderResponse,
  CreateFolderInput,
  RenameFolderInput,
  DeleteFolderInput,
  MoveFolderInput,
  MoveSpecSheetToFolderInput,
} from '@/components/lib/graphql/spec-sheets';
