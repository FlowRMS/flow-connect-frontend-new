/**
 * Spec Sheets Data Hook
 * Provides all data needed by SpecSheetsContent component
 * Acts as an adapter between API and component, allowing gradual migration from mock data
 */

import { useMemo } from 'react';
import {
  useManufacturersWithSpecSheets,
  useSpecSheetSearchWithFactoryNames,
} from '../api/useSpecSheetsApi';
import type { SpecSheet, SpecSheetFolder, HighlightDefinition } from '@/lib/types/submittals';

// For now, we use mock data for folders and highlights since those APIs aren't ready yet
// TODO: Replace with real API when available
import {
  mockSpecSheetFolders,
  mockHighlightDefinitions,
  getAllSpecSheetTags,
  getRootFoldersForManufacturer,
  getChildFolders,
} from '@/lib/data/submittals-mock';

interface UseSpecSheetsDataOptions {
  searchTerm?: string;
  factoryId?: string;
  publishedOnly?: boolean;
}

interface UseSpecSheetsDataResult {
  // Data
  specSheets: SpecSheet[];
  manufacturers: { id: string; name: string }[];
  folders: SpecSheetFolder[];
  highlightDefinitions: HighlightDefinition[];
  allTags: string[];

  // Loading states
  isLoading: boolean;
  isLoadingManufacturers: boolean;
  isLoadingSpecSheets: boolean;

  // Error states
  error: Error | null;

  // Utility functions (from mock for now, will be replaced)
  getRootFoldersForManufacturer: typeof getRootFoldersForManufacturer;
  getChildFolders: typeof getChildFolders;
  getHighlightCount: (specSheetId: string) => number;
  getSpecSheetCountInFolder: (folderId: string) => number;
  getSpecSheetCountByTag: (tag: string, specSheets: SpecSheet[]) => number;
}

/**
 * Hook that provides all data needed by SpecSheetsContent
 * Combines API data with utility functions
 */
export function useSpecSheetsData(options: UseSpecSheetsDataOptions = {}): UseSpecSheetsDataResult {
  const { searchTerm, factoryId, publishedOnly = false } = options;

  // Fetch manufacturers
  const {
    data: manufacturers = [],
    isLoading: isLoadingManufacturers,
    error: manufacturersError,
  } = useManufacturersWithSpecSheets();

  // Fetch spec sheets based on search/filter criteria
  const {
    data: specSheets = [],
    isLoading: isLoadingSpecSheets,
    error: specSheetsError,
  } = useSpecSheetSearchWithFactoryNames(
    {
      searchTerm: searchTerm || undefined,
      factoryId: factoryId || undefined,
      publishedOnly,
    },
    true // always enabled for now
  );

  // Get all unique tags from spec sheets
  const allTags = useMemo(() => {
    // If we have API data, extract tags from it
    if (specSheets.length > 0) {
      const tagSet = new Set<string>();
      specSheets.forEach(sheet => {
        sheet.tags?.forEach(tag => tagSet.add(tag));
      });
      return Array.from(tagSet).sort();
    }
    // Fallback to mock
    return getAllSpecSheetTags();
  }, [specSheets]);

  // Utility function: get highlight count for a spec sheet
  const getHighlightCount = useMemo(() => {
    return (specSheetId: string): number => {
      // TODO: Replace with API when highlight versions are loaded
      return mockHighlightDefinitions.filter(h => h.specSheetId === specSheetId).length;
    };
  }, []);

  // Utility function: get spec sheet count in a folder
  const getSpecSheetCountInFolder = useMemo(() => {
    return (folderId: string): number => {
      return specSheets.filter(s => s.folderId === folderId).length;
    };
  }, [specSheets]);

  // Utility function: get spec sheet count by tag
  const getSpecSheetCountByTag = useMemo(() => {
    return (tag: string, sheets: SpecSheet[]): number => {
      return sheets.filter(s => s.tags?.includes(tag)).length;
    };
  }, []);

  // Combined loading state
  const isLoading = isLoadingManufacturers || isLoadingSpecSheets;

  // Combined error state
  const error = manufacturersError || specSheetsError;

  return {
    // Data
    specSheets,
    manufacturers,
    folders: mockSpecSheetFolders, // TODO: Replace with API
    highlightDefinitions: mockHighlightDefinitions, // TODO: Replace with API
    allTags,

    // Loading states
    isLoading,
    isLoadingManufacturers,
    isLoadingSpecSheets,

    // Error
    error,

    // Utility functions
    getRootFoldersForManufacturer,
    getChildFolders,
    getHighlightCount,
    getSpecSheetCountInFolder,
    getSpecSheetCountByTag,
  };
}

export type { UseSpecSheetsDataOptions, UseSpecSheetsDataResult };
