/**
 * Utility functions for synchronizing filters between AdvancedFilters and ColumnFilters
 * Now both use ActiveFilter[], so we only need to group/ungroup by column
 */

import type { ActiveFilter } from '../types';
import type { FilterOption } from '../types';

/**
 * Convert ActiveFilter[] (from AdvancedFilters) to Record<string, ActiveFilter[]> (for ColumnFilters)
 * Groups filters by column key
 */
export function convertAdvancedToColumn(
  activeFilters: ActiveFilter[],
  filterOptions: FilterOption[],
  columnKeyToFilterId: Record<string, string>
): Record<string, ActiveFilter[]> {
  const columnFilters: Record<string, ActiveFilter[]> = {};

  // Create reverse mapping: filterId -> columnKey
  const filterIdToColumnKey: Record<string, string> = {};
  Object.entries(columnKeyToFilterId).forEach(([columnKey, filterId]) => {
    filterIdToColumnKey[filterId] = columnKey;
  });

  // Group filters by column key
  activeFilters.forEach((filter) => {
    // Find the filter option that matches this columnName
    const filterOption = filterOptions.find(
      (opt) => opt.columnName === filter.columnName
    );
    if (!filterOption) {
      return;
    }

    const filterId = filterOption.id;
    const columnKey = filterIdToColumnKey[filterId];
    if (!columnKey) {
      return;
    }

    // Add filter to the array for this column
    if (!columnFilters[columnKey]) {
      columnFilters[columnKey] = [];
    }
    columnFilters[columnKey].push(filter);
  });

  return columnFilters;
}

/**
 * Convert Record<string, ActiveFilter[]> (from ColumnFilters) to ActiveFilter[] (for AdvancedFilters)
 * Flattens grouped filters into a single array
 */
export function convertColumnToAdvanced(
  columnFilters: Record<string, ActiveFilter[]>,
  filterOptions: FilterOption[],
  columnKeyToFilterId: Record<string, string>
): ActiveFilter[] {
  const activeFilters: ActiveFilter[] = [];

  // Flatten all filters from all columns into a single array
  Object.values(columnFilters).forEach((filters) => {
    // Ensure filters is always an array before spreading
    if (Array.isArray(filters)) {
      activeFilters.push(...filters);
    }
  });

  return activeFilters;
}
