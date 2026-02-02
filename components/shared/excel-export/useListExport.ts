/**
 * useListExport Hook
 * Generic hook for exporting list data to Excel
 * 
 * Converts ExportContext to the format required by exportGridXlsxWithHeaders
 */

import { useCallback, useMemo } from 'react';
import { exportGridXlsxWithHeaders } from '@/lib/analytics/utils/exportGridCsv';
import type { ColumnForExport } from '@/lib/analytics/utils/exportGridCsv';
import type {
  ExportContext,
  ExportOptions,
  ExportColumnConfig,
  ExportType,
} from './types';

/**
 * Generic column configuration interface
 * Any entity can use this if their ColumnConfig has exportType
 */
interface ColumnConfigWithExportType {
  id: string;
  label: string;
  exportType?: ExportType;
  apiField?: string; // Field name in API data (if different from id)
}

/**
 * Get default value based on ExportType
 */
function getDefaultValueByType(exportType: ExportType): unknown {
  switch (exportType) {
    case 'currency':
    case 'number':
      return 0;
    case 'date':
    case 'array':
    case 'text':
    default:
      return '';
    case 'percentage':
      return 0;
  }
}

/**
 * Format array value for export
 * Handles both string arrays and object arrays (extracts fullName for salesReps)
 */
function formatArrayForExport(value: unknown, columnId: string): string {
  if (!value) {
    return '';
  }

  if (!Array.isArray(value)) {
    // If it's not an array, try to convert it
    return String(value);
  }

  if (value.length === 0) {
    return '';
  }

  // Special case: salesReps is array of objects with fullName
  if (columnId === 'salesReps') {
    const formatted = value
      .map((rep: { fullName?: string; avgSplitRate?: number; total?: number }) => {
        if (!rep || typeof rep !== 'object') return '';
        // Extract fullName if available
        const name = rep.fullName || '';
        return name;
      })
      .filter(Boolean)
      .join(', ');
    return formatted || ''; // Ensure we return empty string, not undefined
  }

  // Default: array of strings/values
  return value
    .map(item => item != null ? String(item) : '')
    .filter(Boolean)
    .join(', ');
}

/**
 * Map API data to export format using column configuration
 * Uses apiField if defined, otherwise uses column id
 */
function mapDataUsingConfig<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnConfigWithExportType[]
): Record<string, unknown>[] {
  const exportableColumns = columns.filter(col => col.exportType !== undefined);

  return data.map((item) => {
    const result: Record<string, unknown> = {};

    exportableColumns.forEach((col) => {
      const apiFieldName = col.apiField || col.id;
      const value = item[apiFieldName];
      const exportType = col.exportType!;

      // Handle special cases
      if (col.id === 'visible' && typeof value === 'boolean') {
        result[col.id] = value !== false;
      } else if (exportType === 'array') {
        // Format array fields as comma-separated strings
        // Always ensure it's a string, never a number or undefined
        const formatted = formatArrayForExport(value, col.id);
        result[col.id] = formatted || '';
      } else {
        result[col.id] = value ?? getDefaultValueByType(exportType);
      }
    });

    return result;
  });
}

/**
 * Convert ColumnConfig array to ExportColumnConfig array
 * Only includes columns that have exportType defined
 * 
 * @param columns - Array of column configurations with exportType
 * @returns Array of ExportColumnConfig ready for export
 */
export function getExportColumnsFromConfig<T extends ColumnConfigWithExportType>(
  columns: T[]
): ExportColumnConfig[] {
  return columns
    .filter(col => col.exportType !== undefined)
    .map(col => ({
      id: col.id,
      label: col.label,
      prop: col.id,
      columnType: col.exportType!,
      include: true,
    }));
}

/**
 * Map API data to export format using column configuration
 * Generic function that works with any entity
 * 
 * @param data - Array of API data objects
 * @param columns - Column configuration with exportType and apiField
 * @returns Array of mapped objects ready for export
 */
export function mapDataForExport<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnConfigWithExportType[]
): Record<string, unknown>[] {
  return mapDataUsingConfig(data, columns);
}

/**
 * Convert ExportColumnConfig to ColumnForExport format
 * This is the format expected by exportGridXlsxWithHeaders
 */
function convertColumnsToExportFormat(
  columns: ExportColumnConfig[]
): ColumnForExport[] {
  return columns
    .filter(col => col.include !== false)
    .map(col => ({
      id: col.id,
      name: col.label,
      prop: col.prop,
      formatter: col.formatter ? (value: unknown) => String(col.formatter!(value)) : undefined,
      columnType: col.columnType,
    }));
}

/**
 * Map column name (API field or column id) to display label
 * Uses column configuration to find the label for a given column name
 */
function mapColumnNameToLabel(
  columnName: string,
  columns: ExportColumnConfig[]
): string {
  // Try to find by id (which might match the columnName)
  const byId = columns.find(col => col.id === columnName);
  if (byId) return byId.label;

  // Try to find by prop (property name in data)
  const byProp = columns.find(col => col.prop === columnName);
  if (byProp) return byProp.label;

  // If not found, return the columnName as-is (capitalized and formatted)
  return columnName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build filters object from active filters and column filters
 * Converts ActiveFilter[] to Record<string, unknown> format expected by exportGridXlsxWithHeaders
 * Maps column names to display labels for better readability in Excel
 */
function buildFiltersObject(
  activeFilters: ExportContext['activeFilters'],
  columnFilters?: ExportContext['columnFilters'],
  columns?: ExportColumnConfig[]
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  // Add active filters from AdvancedFilters
  activeFilters.forEach(filter => {
    const displayName = columns 
      ? mapColumnNameToLabel(filter.columnName, columns)
      : filter.columnName;
    
    if (filter.values && filter.values.length > 0) {
      // Multiple values (IN operator)
      filters[displayName] = filter.values;
    } else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
      // Single value
      filters[displayName] = filter.value;
    }
  });

  // Add column filters (if any)
  if (columnFilters) {
    Object.entries(columnFilters).forEach(([key, filterArray]) => {
      if (filterArray && filterArray.length > 0) {
        const displayName = columns 
          ? mapColumnNameToLabel(key, columns)
          : key;
        
        // Extract values from column filters
        const values = filterArray
          .flatMap(f => {
            if (f.values && f.values.length > 0) {
              return f.values;
            }
            if (f.value !== undefined && f.value !== null && f.value !== '') {
              return [f.value];
            }
            return [];
          })
          .filter(Boolean);
        
        if (values.length > 0) {
          filters[displayName] = values.length === 1 ? values[0] : values;
        }
      }
    });
  }

  return filters;
}

/**
 * Generic hook for exporting list data to Excel
 * 
 * @param context - Export context with data, columns, filters, etc.
 * @param options - Optional export customization options
 * @returns Object with exportToExcel function and canExport boolean
 * 
 * @example
 * const { exportToExcel, canExport } = useListExport(context, {
 *   includeHeaderInfo: true,
 *   filename: 'custom-export',
 * });
 */
export function useListExport<T = Record<string, unknown>>(
  context: ExportContext<T>,
  options: ExportOptions = {}
) {
  const {
    includeHeaderInfo = true,
    filename: customFilename,
    sheetName: customSheetName,
    reportTitle: customReportTitle,
  } = options;

  // Convert columns to export format
  const exportColumns = useMemo(
    () => convertColumnsToExportFormat(context.columns),
    [context.columns]
  );

  // Build filters object
  const filters = useMemo(
    () => buildFiltersObject(context.activeFilters, context.columnFilters, context.columns),
    [context.activeFilters, context.columnFilters, context.columns]
  );

  // Build sorting array
  const sorting = useMemo(() => {
    if (!context.sorting) return [];
    return context.sorting.map(sort => ({
      prop: sort.prop,
      order: sort.order,
    }));
  }, [context.sorting]);

  // Generate filename
  const filename = useMemo(() => {
    if (customFilename) {
      return customFilename;
    }
    const dateStamp = new Date().toISOString().split('T')[0];
    return `${context.entityType}-export-${dateStamp}`;
  }, [customFilename, context.entityType]);

  // Core export logic (shared between exportToExcel and exportData)
  const doExport = useCallback(async (rows: Record<string, unknown>[]) => {
    if (rows.length === 0) {
      console.warn(`No ${context.entityType} data to export`);
      return;
    }

    if (exportColumns.length === 0) {
      console.warn(`No columns configured for ${context.entityType} export`);
      return;
    }

    try {
      await exportGridXlsxWithHeaders({
        filename,
        columns: exportColumns,
        rows,
        sheetName: customSheetName || context.entityType,
        filters,
        dateRange: context.quickDateRange,
        sorting,
        reportTitle: customReportTitle || context.reportTitle || `${context.entityType.charAt(0).toUpperCase() + context.entityType.slice(1)} Export`,
        includeHeaderInfo,
      });
    } catch (error) {
      console.error(`Failed to export ${context.entityType}:`, error);
      throw error;
    }
  }, [
    context.entityType,
    context.quickDateRange,
    context.reportTitle,
    exportColumns,
    filename,
    customSheetName,
    filters,
    sorting,
    customReportTitle,
    includeHeaderInfo,
  ]);

  // Export using context data (currently loaded)
  const exportToExcel = useCallback(async () => {
    await doExport(context.data as Record<string, unknown>[]);
  }, [context.data, doExport]);

  // Export with externally provided data (e.g. fetched-all data)
  const exportData = useCallback(async (rows: Record<string, unknown>[]) => {
    await doExport(rows);
  }, [doExport]);

  // Check if export is possible
  const canExport = context.data.length > 0 && exportColumns.length > 0;

  return {
    exportToExcel,
    exportData,
    canExport,
  };
}
