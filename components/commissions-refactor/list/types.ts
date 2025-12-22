/**
 * Commissions List - Type Definitions
 * Local types for the commissions list component
 */

import type { CommissionCheck } from '@/lib/types/rms';

// Sort configuration
export type SortField =
  | 'checkNumber'
  | 'status'
  | 'netAmount'
  | 'commissionMonth'
  | 'manufacturerName'
  | 'postDate'
  | 'checkDate'
  | 'entryDate'
  | 'checkBalance';

export type SortDirection = 'asc' | 'desc';

// Date range filter
export interface DateRange {
  start: string;
  end: string;
}

// Column filters
export interface ColumnFilters {
  checkNumber: string;
  status: string[];
  manufacturerName: string[];
  commissionMonth: DateRange;
  postDate: DateRange;
  checkDate: DateRange;
  entryDate: DateRange;
}

// Quick date filter
export type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
export type QuickDateField = 'entryDate' | 'commissionMonth';

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

// Status tab configuration
export interface StatusTab {
  label: string;
  value: string;
  count: number;
}

