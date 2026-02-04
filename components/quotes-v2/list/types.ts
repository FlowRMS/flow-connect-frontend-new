/**
 * Quotes V2 List - Type Definitions
 * Local types for the quotes-v2 list component
 */

import type { ExportType } from '@/components/shared/excel-export/types';

// Column configuration
// Currently only used for Excel export
// Will be extended later for table rendering, sorts, and filters
export interface ColumnConfig {
  id: string;
  label: string;
  exportType: ExportType; // Required for export columns
  apiField?: string; // Field name in the API response if different from 'id'
  // Optional fields for future use (table rendering, sorts, filters)
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
}
