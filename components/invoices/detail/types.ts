/**
 * Invoice Detail - Type Definitions
 * Local types for the invoice detail component
 */

import type { Invoice as BaseInvoice, OrderSplitRate, InvoiceStatus } from '@/lib/types/rms';

// Extended InvoiceLineItem - standalone type for editing with all needed fields
// This is the local type used for editing state, separate from the RMS type
export interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  productId?: string;
  partNumber: string;
  custPartNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  uom: string | null;
  uomId?: string | null;
  divisor: number;
  total: number;
  // Amount is the extended price (qty * unitPrice / divisor)
  amount: number;
  // Commission fields - commissionRate is decimal (0.08 = 8%), commissionAmount is the dollar amount
  commissionRate: number;
  commissionAmount: number;
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
  // Link to order line item if invoice was created from an order
  orderLineItemId?: string;
  invoicedBalance?: number;
  outsideSplitRates?: {
    userId: string;
    userName: string;
    splitRate: number;
    position: number;
  }[];
  insideSplitRates?: {
    userId: string;
    userName: string;
    splitRate: number;
    position: number;
  }[];
  // Optional fields for warehouse/consignment tracking
  isWarehouseConsignment?: boolean;
  inventoryOnHand?: number;
  // Document-specific product flag (adhoc products created for this invoice)
  isQuoteLevelProduct?: boolean;
}

// Extended Invoice type for local editing state
// Uses the extended InvoiceLineItem type instead of the base one
export interface EditableInvoice extends Omit<BaseInvoice, 'lineItems'> {
  lineItems: InvoiceLineItem[];
  // API fields not in base type
  published?: boolean;

  // Order-populated fields (read-only when connected to order)
  // Customer fields
  soldToCustomerId?: string;
  soldToCustomerName?: string;
  billToCustomerId?: string;
  billToCustomerName?: string;
  endUserId?: string;
  endUserName?: string;

  // Order reference fields
  poNumber?: string;
  jobId?: string;
  jobName?: string;

  // Terms (from order)
  paymentTerms?: string;
  paymentTermsId?: string;
  freightTerms?: string;
  freightTermsId?: string;
  shippingTerms?: string;
  shippingTermsId?: string;

  // Rep fields (from order)
  outsideRepId?: string;
  outsideRepName?: string;
  insideRepId?: string;
  insideRepName?: string;

  // Header-level split rates (when NOT per-line-item, grabbed from first line item)
  outsideSplitRates?: {
    userId: string;
    userName: string;
    splitRate: number;
    position: number;
  }[];
  insideSplitRates?: {
    userId: string;
    userName: string;
    splitRate: number;
    position: number;
  }[];

  // Per-line-item flags from order - when true, these are set per line item in Additional Details
  // When false, they should be shown in header fields (read-only from order)
  outsidePerLineItem?: boolean;
  insidePerLineItem?: boolean;
  endUserPerLineItem?: boolean;

  // Flag to indicate fields are populated from order (should be read-only)
  isPopulatedFromOrder?: boolean;
}

// Tab types
export type TabType =
  | 'line-items'
  | 'files'
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
  disabled?: boolean;
  disabledReason?: string;
  comingSoon?: boolean;
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

