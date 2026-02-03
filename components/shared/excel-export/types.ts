/**
 * Excel Export Types
 * Common types for list export functionality
 * 
 */

import type { ActiveFilter } from '@/components/advancedFilters/types';

/**
 * Entity types that support Excel export
 */
export type ExportableEntityType = 'orders' | 'invoices' | 'quotes' | 'statements';

/**
 * Export type for formatting in Excel
 * Single source of truth for export column types
 */
export type ExportType = 'currency' | 'date' | 'percentage' | 'text' | 'number' | 'array';

/**
 * Configuration for export columns
 * Maps table columns to Excel export format
 */
export interface ExportColumnConfig {
  /** Column identifier (matches table column id) */
  id: string;
  /** Display label for the column header */
  label: string;
  /** Property name in the data object */
  prop: string;
  /** Optional formatter function for custom formatting */
  formatter?: (value: unknown) => string | number;
  /** Column type for automatic formatting (currency, date, etc.) */
  columnType?: ExportType;
  /** Whether to include this column in export (default: true) */
  include?: boolean;
}

/**
 * Export context - all the data needed for export
 * Generic type T allows different entity types (Order, Invoice, etc.)
 */
export interface ExportContext<T = Record<string, unknown>> {
  /** Entity type being exported */
  entityType: ExportableEntityType;
  /** Filtered data to export (already mapped to export format) */
  data: T[];
  /** Column configuration */
  columns: ExportColumnConfig[];
  /** Active filters from AdvancedFilters component */
  activeFilters: ActiveFilter[];
  /** Column filters (if any) */
  columnFilters?: Record<string, ActiveFilter[]>;
  /** Quick date filter preset */
  quickDatePreset?: string;
  /** Quick date field name */
  quickDateField?: string;
  /** Quick date range (computed from preset) */
  quickDateRange?: { startDate?: string; endDate?: string };
  /** Sorting configuration */
  sorting?: Array<{ prop: string; order: 'asc' | 'desc' }>;
  /** Search query */
  searchQuery?: string;
  /** Report title for Excel header */
  reportTitle?: string;
}

/**
 * Export options
 * Customization options for the export
 */
export interface ExportOptions {
  /** Include header info (filters, sorting, etc.) in Excel */
  includeHeaderInfo?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** Sheet name */
  sheetName?: string;
  /** Report title (overrides context reportTitle) */
  reportTitle?: string;
}

/**
 * Mapper function type
 * Transforms entity data to exportable format
 */
export type EntityMapper<T = Record<string, unknown>> = (
  data: T[]
) => Record<string, unknown>[];

/**
 * Export configuration per entity
 * Defines how to export a specific entity type
 */
export interface EntityExportConfig<T = Record<string, unknown>> {
  /** Entity type */
  entityType: ExportableEntityType;
  /** Default columns for this entity */
  defaultColumns: ExportColumnConfig[];
  /** Mapper function to transform entity data */
  mapper: EntityMapper<T>;
  /** Default report title */
  defaultReportTitle: string;
  /** Default sheet name */
  defaultSheetName: string;
}
