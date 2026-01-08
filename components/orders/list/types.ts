/**
 * Orders List - Type Definitions
 * Local types for the orders list component
 */

import type { Order } from '@/lib/types/rms';

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
}

// Bulk actions
export type BulkAction =
  | 'set_status'
  | 'delete'
  | 'create_credit'
  | 'add_acknowledgement';


export type OrderStatus =
  | 'OPEN'
  | 'PARTIAL_SHIPPED'
  | 'SHIPPED_COMPLETE'
  | 'CANCELLED'
  | 'OVER_SHIPPED'
  | 'PARTIAL_CANCELLED'
  | 'OVER_CANCELLED';