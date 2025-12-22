/**
 * Invoices List - Type Definitions
 * Local types for the invoices list component
 */

import type { Invoice } from '@/lib/types/rms';

// Sort configuration
export type SortField =
  | 'invoiceNumber'
  | 'customerName'
  | 'manufacturerName'
  | 'invoiceDate'
  | 'dueDate'
  | 'total'
  | 'balance'
  | 'status';

export type SortDirection = 'asc' | 'desc';

// Date range filter
export interface DateRange {
  start: string;
  end: string;
}

// Column filters
export interface ColumnFilters {
  invoiceNumber: string;
  customerName: string[];
  manufacturerName: string[];
  invoiceDate: DateRange;
  dueDate: DateRange;
  total: string[];
  balance: string[];
  status: string[];
}

// Quick date filter
export type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
export type QuickDateField = 'entryDate' | 'invoiceDate';

// Filter option for AdvancedFilters
export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'date';
}

// Column configuration
export interface ColumnConfig {
  id: string;
  width: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  align?: 'left' | 'center' | 'right';
}

// Bulk actions
export type BulkAction = 'set_status' | 'delete';

