/**
 * Orders List - Type Definitions
 * Local types for the orders list component
 */

import type { Order } from '@/lib/types/rms';
import type { ExportType } from '@/components/shared/excel-export/types';

// Sort configuration
export type SortField =
  | 'orderNumber'
  | 'customerName'
  | 'manufacturerName'
  | 'orderDate'
  | 'total'
  | 'totalCommission'
  | 'status';

export type SortDirection = 'asc' | 'desc';

// Date range filter
export interface DateRange {
  start: string;
  end: string;
}

// Column filters
export interface ColumnFilters {
  orderNumber: string;
  customerName: string[];
  manufacturerName: string[];
  orderDate: DateRange;
  total: string[];
  totalCommission: string[];
  status: string[];
}

// Quick date filter
export type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
export type QuickDateField = 'createdAt' | 'orderDate';

// Credit modal line item
export interface CreditLineItem {
  partNumber: string;
  amount: number;
  quantity: number;
  unitCredit: number;
  commissionPercent: number;
  commissionAmount: number;
  reason: string;
}

// Acknowledgement modal line item
export interface AcknowledgementLineItem {
  lineId: string;
  partNumber: string;
  orderedQty: number;
  acknowledgedQty: number;
}

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
  exportType?: ExportType; // Type for Excel export formatting
  apiField?: string; // Field name in OrderLandingPage (if different from id)
}

// Bulk actions
export type BulkAction =
  | 'set_status'
  | 'delete'
  | 'create_credit'
  | 'add_acknowledgement';

