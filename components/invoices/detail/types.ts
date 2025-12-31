/**
 * Invoice Detail - Type Definitions
 * Local types for the invoice detail component
 */

import type { Invoice as BaseInvoice, InvoiceLineItem as BaseInvoiceLineItem, OrderSplitRate, InvoiceStatus } from '@/lib/types/rms';

// Extended InvoiceLineItem with additional fields for editing
export interface InvoiceLineItem extends Omit<BaseInvoiceLineItem, 'lineNumber'> {
  lineNumber: number;
  productId?: string;
  partNumber: string;
  custPartNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  uomId?: string;
  divisor: number;
  total: number;
  commissionPercent: number;
  commission: number;
  discountPercent?: number;
  discount?: number;
  commissionDiscountPercent?: number;
  commissionDiscount?: number;
  status?: string;
  leadTime?: string;
  note?: string;
  endUserId?: string;
  orderDetailId?: string;
  invoicedBalance?: number;
  outsideSplitRates?: {
    userId: string;
    userName: string;
    splitRate: number;
    position: number;
  }[];
  // Optional fields for warehouse/consignment tracking
  isWarehouseConsignment?: boolean;
  inventoryOnHand?: number;
}

// Extended Invoice type for local editing state
// Uses the extended InvoiceLineItem type instead of the base one
export interface EditableInvoice extends Omit<BaseInvoice, 'lineItems'> {
  lineItems: InvoiceLineItem[];
  // API fields not in base type
  published?: boolean;
}

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

// View configuration for saved views
export interface ViewConfig {
  id: string;
  name: string;
  columns: ColumnKey[];
}

