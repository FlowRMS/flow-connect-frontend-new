/**
 * Hook for synchronizing filters between AdvancedFilters and ColumnFilters
 * 
 * This hook provides bidirectional synchronization:
 * - When AdvancedFilters change, it converts them to ColumnFilters format
 * - When ColumnFilters change, it converts them to AdvancedFilters format
 * 
 * The most recent filter for the same column replaces the previous one.
 */

import { useCallback, useMemo } from 'react';
import type { ActiveFilter } from '../types';
import type { FilterOption } from '../types';
import { convertAdvancedToColumn, convertColumnToAdvanced } from '../utils/filterSyncUtils';

interface UseFilterSyncOptions {
  filterOptions: FilterOption[];
  columnKeyToFilterId: Record<string, string>;
}

interface UseFilterSyncReturn {
  syncAdvancedToColumn: (activeFilters: ActiveFilter[]) => Record<string, ActiveFilter[]>;
  syncColumnToAdvanced: (columnFilters: Record<string, ActiveFilter[]>) => ActiveFilter[];
}

export function useFilterSync({
  filterOptions,
  columnKeyToFilterId,
}: UseFilterSyncOptions): UseFilterSyncReturn {
  // Memoize filterOptions and columnKeyToFilterId to ensure stable references
  const memoizedFilterOptions = useMemo(() => filterOptions, [filterOptions]);
  const memoizedColumnKeyToFilterId = useMemo(() => columnKeyToFilterId, [columnKeyToFilterId]);

  /**
   * Convert AdvancedFilters (ActiveFilter[]) to ColumnFilters format (Record<string, ActiveFilter[]>)
   * This is used when AdvancedFilters change and we need to sync to ColumnFilters
   * Simply groups filters by column key
   */
  const syncAdvancedToColumn = useCallback(
    (activeFilters: ActiveFilter[]): Record<string, ActiveFilter[]> => {
      return convertAdvancedToColumn(activeFilters, memoizedFilterOptions, memoizedColumnKeyToFilterId);
    },
    [memoizedFilterOptions, memoizedColumnKeyToFilterId]
  );

  /**
   * Convert ColumnFilters (Record<string, ActiveFilter[]>) to AdvancedFilters (ActiveFilter[]) format
   * This is used when ColumnFilters change and we need to sync to AdvancedFilters
   * Simply flattens the grouped filters into a single array
   */
  const syncColumnToAdvanced = useCallback(
    (columnFilters: Record<string, ActiveFilter[]>): ActiveFilter[] => {
      return convertColumnToAdvanced(columnFilters, memoizedFilterOptions, memoizedColumnKeyToFilterId);
    },
    [memoizedFilterOptions, memoizedColumnKeyToFilterId]
  );

  return {
    syncAdvancedToColumn,
    syncColumnToAdvanced,
  };
}

