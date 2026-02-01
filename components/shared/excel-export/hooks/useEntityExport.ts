/**
 * useEntityExport Hook
 * Generic convenience hook for entity exports
 * 
 * Works with any entity that has:
 * - LandingPage data type
 * - ColumnConfig array with exportType
 * - OrderBy type for sorting
 * - Quick date range function (optional)
 * 
 * This avoids code duplication when adding exports for other entities
 */

import { useMemo } from 'react';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { useListExport, getExportColumnsFromConfig, mapDataForExport } from '../useListExport';
import type { ExportContext, ExportOptions, ExportableEntityType, ExportColumnConfig, ExportType } from '../types';

/**
 * Generic column configuration interface
 */
interface ColumnConfigWithExportType {
  id: string;
  label: string;
  exportType?: ExportType;
  apiField?: string;
}

/**
 * Generic OrderBy interface
 */
interface GenericOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Quick date range result
 */
interface QuickDateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Configuration for entity export
 */
interface EntityExportConfig<T = Record<string, unknown>> {
  /** Entity type */
  entityType: ExportableEntityType;
  /** Column configuration array */
  columns: ColumnConfigWithExportType[];
  /** Quick date range calculator function (optional) */
  getQuickDateRange?: (preset: string) => QuickDateRange;
  /** Default report title */
  reportTitle: string;
}

interface UseEntityExportParams<T = Record<string, unknown>> {
  /** Landing page data from API */
  data: T[];
  /** Active filters from AdvancedFilters */
  activeFilters: ActiveFilter[];
  /** Column filters (if any) */
  columnFilters?: Record<string, ActiveFilter[]>;
  /** Quick date filter preset */
  quickDatePreset?: string;
  /** Quick date field name */
  quickDateField?: string;
  /** Sorting configuration from API */
  sorting?: GenericOrderBy[];
  /** Search query */
  searchQuery?: string;
  /** Export options */
  options?: ExportOptions;
  /** Entity export configuration */
  config: EntityExportConfig<T>;
}

/**
 * Generic hook for exporting any entity to Excel
 * 
 * @param params - Entity-specific export parameters and configuration
 * @returns Object with exportToExcel function and canExport boolean
 * 
 * @example
 * const { exportToExcel, canExport } = useEntityExport({
 *   data: state.allOrdersData,
 *   activeFilters: state.activeFilters,
 *   sorting: state.serverOrderBy,
 *   config: {
 *     entityType: 'orders',
 *     columns: ORDER_TABLE_COLUMNS,
 *     getQuickDateRange: getQuickDateRange,
 *     reportTitle: 'Orders Export',
 *   },
 * });
 */
export function useEntityExport<T extends Record<string, unknown>>({
  data,
  activeFilters,
  columnFilters,
  quickDatePreset = 'all',
  quickDateField,
  sorting,
  searchQuery,
  options,
  config,
}: UseEntityExportParams<T>) {
  // Map data to export format using column configuration
  const mappedData = useMemo(
    () => mapDataForExport(data, config.columns),
    [data, config.columns]
  );

  // Get export columns from configuration
  const exportColumns = useMemo(
    () => getExportColumnsFromConfig(config.columns),
    [config.columns]
  );

  // Calculate quick date range if preset is not 'all' and function is provided
  const quickDateRange = useMemo(() => {
    if (quickDatePreset === 'all' || !config.getQuickDateRange) {
      return undefined;
    }
    const range = config.getQuickDateRange(quickDatePreset);
    if (!range.start || !range.end) {
      return undefined;
    }
    return {
      startDate: range.start.toISOString().split('T')[0],
      endDate: range.end.toISOString().split('T')[0],
    };
  }, [quickDatePreset, config.getQuickDateRange]);

  // Convert sorting to export format
  const exportSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) return undefined;
    return sorting.map(sort => ({
      prop: sort.columnName,
      order: sort.direction.toLowerCase() as 'asc' | 'desc',
    }));
  }, [sorting]);

  // Build export context
  const context: ExportContext<Record<string, unknown>> = useMemo(
    () => ({
      entityType: config.entityType,
      data: mappedData,
      columns: exportColumns,
      activeFilters,
      columnFilters,
      quickDatePreset,
      quickDateField,
      quickDateRange,
      sorting: exportSorting,
      searchQuery,
      reportTitle: config.reportTitle,
    }),
    [
      config.entityType,
      mappedData,
      exportColumns,
      activeFilters,
      columnFilters,
      quickDatePreset,
      quickDateField,
      quickDateRange,
      exportSorting,
      searchQuery,
      config.reportTitle,
    ]
  );

  const listExport = useListExport(context, options);

  return {
    ...listExport,
    context, // Expose context for ExportExcelButton
  };
}
