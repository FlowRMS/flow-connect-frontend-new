/**
 * Generic sorting types for reusable sort functionality
 */

export type SortDirection = 'ASC' | 'DESC';

export interface SortConfig {
  id: string;                    // Unique ID (used internally)
  label: string;                 // Label to display in UI
  backendColumn: string;         // Backend API column name
  availableInMenu?: boolean;     // Whether it appears in the dropdown menu (default: true)
  availableInColumns?: boolean;  // Whether it appears in table headers (default: true)
  defaultDirection?: SortDirection; // Default direction (default: 'DESC')
}

export interface ActiveSort {
  columnId: string;              // Configuration ID
  direction: SortDirection;
}

export interface SortConfigOptions {
  configs: SortConfig[];
  defaultSort?: ActiveSort;      // Default sort
}

