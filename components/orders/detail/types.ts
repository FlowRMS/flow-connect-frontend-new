/**
 * Order Detail - Type Definitions
 * Local types for the order detail component
 */

import type { Order, OrderLineItem, OrderSplitRate } from '@/lib/types/rms';

// Tab types
export type TabType =
  | 'line-items'
  | 'files'
  | 'credits'
  | 'adjustments'
  | 'acknowledgements'
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
  | 'shippedQty'
  | 'lineStatus'
  | 'linkedQuote'
  | 'linkedInvoice'
  | 'linkedCheck'
  | 'linkedFulfillment'
  | 'sellTotal'
  | 'commissionPercent'
  | 'commission'
  | 'commissionTotal'
  | 'invoiced'
  | 'percentOver'
  | 'commissionAmount'
  | 'ovgPercent'
  | 'ovgAmount'
  | 'earnPercent'
  | 'earnAmount'
  | 'iconAcknowledgement'
  | 'iconDocumentSpecific'
  | 'iconWarehouse'
  | 'iconCredit';

// View configuration
export interface ViewConfig {
  id: string;
  name: string;
  columns: ColumnKey[];
}

// View mode (header dropdown)
export type ViewMode = 'simple' | 'overage';

// Section display mode
export type SectionDisplayMode = 'column' | 'lineShelf';

// Rep split configuration
export interface RepSplit {
  repId: string;
  repName: string;
  percentage: number;
}

// Line item acknowledgement data
export interface LineItemAcknowledgement {
  ackNumber: string;
  shipDate: string;
  acknowledgedQty: number;
}

// Line item credit data
export interface LineItemCredit {
  creditName: string;
  creditType: string;
  creditQty: number;
  originalQty: number;
  originalTotal: number;
}

// Acknowledgement line item for modal
export interface AcknowledgementLineItem {
  lineId: string;
  partNumber: string;
  orderedQty: number;
  acknowledgedQty: number;
  shipDate: string;
}

// Product for warehouse conversion
export interface ProductToConvert {
  id: string;
  partNumber: string;
  isAlreadyWarehouse: boolean;
}

// Line item for fulfillment request
export interface LineItemForFulfillment {
  id: string;
  partNumber: string;
  quantity: number;
  hasExistingRequest: boolean;
}

// Invoice tooltip state
export interface InvoiceTooltipState {
  visible: boolean;
  x: number;
  y: number;
  invoices: any[]; // Invoice[] from rms types
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
