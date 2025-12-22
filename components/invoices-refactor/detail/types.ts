/**
 * Invoice Detail - Type Definitions
 * Local types for the invoice detail component
 */

import type { Invoice, InvoiceLineItem, OrderSplitRate } from '@/lib/types/rms';

// Tab types
export type TabType =
  | 'line-items'
  | 'credits'
  | 'notes'
  | 'tasks'
  | 'activity'
  | 'linked-objects'
  | 'settings';

// Column configuration for line items table
export type ColumnKey =
  | 'partNumber'
  | 'custPartNumber'
  | 'description'
  | 'uom'
  | 'divisor'
  | 'unitPrice'
  | 'quantity'
  | 'linkedOrder'
  | 'linkedCheck'
  | 'sellTotal'
  | 'commissionPercent'
  | 'commission'
  | 'commissionTotal'
  | 'percentOver'
  | 'commissionAmount'
  | 'ovgPercent'
  | 'ovgAmount'
  | 'earnPercent'
  | 'earnAmount';

// View mode (header dropdown)
export type ViewMode = 'simple' | 'overage';

// Rep split configuration
export interface RepSplit {
  repId: string;
  repName: string;
  percentage: number;
}

// Line item credit data (inherited from linked order)
export interface LineItemCredit {
  creditName: string;
  creditType: string;
  creditQty: number;
  originalQty: number;
  originalTotal: number;
}

// Product for warehouse conversion
export interface ProductToConvert {
  id: string;
  partNumber: string;
  isAlreadyWarehouse: boolean;
}

// Version info
export interface VersionInfo {
  version: number;
  date: string;
  isLatest: boolean;
}

// Tab configuration
export interface TabConfig {
  id: TabType;
  label: string;
  count?: number;
}

// Order tooltip state (for linked orders in line items)
export interface OrderTooltipState {
  visible: boolean;
  x: number;
  y: number;
  orders: any[]; // Order[] from rms types
}

