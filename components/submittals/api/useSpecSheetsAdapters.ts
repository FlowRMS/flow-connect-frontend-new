/**
 * Spec Sheets Adapter Hooks
 * Hooks that transform API responses to frontend types
 */

import { useFactories } from '@/components/warehouse/api/useFactoriesApi';
import type { SpecSheet } from '@/lib/types/submittals';
import type { SpecSheetResponse } from '@/components/lib/graphql/spec-sheets';
import { useSpecSheetsByFactory, useSpecSheetSearch } from './useSpecSheetsApi';

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform API spec sheet response to frontend SpecSheet type
 * Maps factoryId to manufacturer name using factory lookup
 */
function transformSpecSheetResponse(
  response: SpecSheetResponse,
  factoryMap: Map<string, string>
): SpecSheet {
  return {
    id: response.id,
    manufacturer: factoryMap.get(response.factoryId) || 'Unknown',
    fileName: response.fileName,
    displayName: response.displayName,
    categories: response.categories as SpecSheet['categories'],
    tags: response.tags || [],
    folderId: undefined, // folder_path is used instead
    uploadSource: response.uploadSource as SpecSheet['uploadSource'],
    sourceUrl: response.sourceUrl || undefined,
    fileUrl: response.fileUrl,
    fileSize: response.fileSize,
    pageCount: response.pageCount,
    uploadedAt: response.createdAt,
    uploadedBy: response.createdBy.fullName,
    needsReview: response.needsReview,
    usageCount: response.usageCount,
    highlightCount: response.highlightCount,
  };
}

// ============================================================================
// Adapter Hooks
// ============================================================================

/**
 * Hook to get spec sheets with manufacturer names resolved
 * Combines spec sheets API with factories API
 */
export function useSpecSheetsWithFactoryNames(factoryId: string | null, publishedOnly: boolean = true) {
  const { data: factories, isLoading: factoriesLoading } = useFactories();
  const { data: specSheets, isLoading: specSheetsLoading, error } = useSpecSheetsByFactory(factoryId, publishedOnly);

  // Build factory ID to name map (FactoryLandingPage uses 'title' for name)
  const factoryMap = new Map<string, string>();
  factories?.forEach(f => factoryMap.set(f.id, f.title));

  // Transform spec sheets to frontend format
  const transformedSpecSheets = specSheets?.map(sheet =>
    transformSpecSheetResponse(sheet, factoryMap)
  );

  return {
    data: transformedSpecSheets,
    isLoading: factoriesLoading || specSheetsLoading,
    error,
    factories: factories?.map(f => ({ id: f.id, name: f.title })) || [],
  };
}

/**
 * Hook to search spec sheets with manufacturer names resolved
 */
export function useSpecSheetSearchWithFactoryNames(params: {
  searchTerm?: string;
  factoryId?: string;
  categories?: string[];
  publishedOnly?: boolean;
  limit?: number;
}, enabled: boolean = true) {
  const { data: factories, isLoading: factoriesLoading } = useFactories();
  const { data: specSheets, isLoading: specSheetsLoading, error } = useSpecSheetSearch(params, enabled);

  // Build factory ID to name map (FactoryLandingPage uses 'title' for name)
  const factoryMap = new Map<string, string>();
  factories?.forEach(f => factoryMap.set(f.id, f.title));

  // Transform spec sheets to frontend format
  const transformedSpecSheets = specSheets?.map(sheet =>
    transformSpecSheetResponse(sheet, factoryMap)
  );

  return {
    data: transformedSpecSheets,
    isLoading: factoriesLoading || specSheetsLoading,
    error,
    factories: factories?.map(f => ({ id: f.id, name: f.title })) || [],
  };
}

/**
 * Hook to get all factories (manufacturers) that have spec sheets
 * This replaces the mock getManufacturersWithSpecSheets function
 */
export function useManufacturersWithSpecSheets() {
  const { data: factories, isLoading, error } = useFactories();

  // TODO: Filter to only factories that have spec sheets
  // For now, return all factories (FactoryLandingPage uses 'title' for name)
  return {
    data: factories?.map(f => ({ id: f.id, name: f.title })) || [],
    isLoading,
    error,
  };
}
