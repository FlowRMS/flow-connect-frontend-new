/**
 * Order Detail - Constants
 * Re-exports and constants for order detail
 */

import type { ColumnKey } from './types';

// Re-export status labels and colors from rms types
export {
  orderStatusLabels,
  orderStatusColors,
  fulfillmentStatusLabels,
  fulfillmentStatusColors,
  billingStatusLabels,
  billingStatusColors,
  commissionStatusLabels,
  commissionStatusColors,
} from '@/lib/types/rms';

// Default visible columns for line items table
export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  'partNumber',
  'custPartNumber',
  'description',
  'quantity',
  'uom',
  'divisor',
  'unitPrice',
  'lineStatus',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
  'linkedQuote',
  'linkedInvoice',
  'linkedCheck',
  'linkedFulfillment',
  'iconAcknowledgement',
  'iconDocumentSpecific',
  'iconWarehouse',
  'iconCredit',
];

// Column labels
export const COLUMN_LABELS: Record<ColumnKey, string> = {
  partNumber: 'Part #',
  custPartNumber: 'Cust Part #',
  description: 'Description',
  uom: 'UOM',
  divisor: 'Divisor',
  unitPrice: 'Unit Price',
  quantity: 'Qty',
  shippedQty: 'Shipped Qty',
  lineStatus: 'Status',
  linkedQuote: 'Quote #',
  linkedInvoice: 'Invoice #',
  linkedCheck: 'Check #',
  linkedFulfillment: 'Fulfillment #',
  sellTotal: 'Sell Total',
  commissionPercent: 'Commission %',
  commission: 'Commission',
  commissionTotal: 'Commission Total',
  invoiced: 'Invoiced',
  percentOver: '% Over',
  commissionAmount: 'Com $',
  ovgPercent: 'Ovg %',
  ovgAmount: 'Ovg $',
  earnPercent: 'Earn %',
  earnAmount: 'Earn $',
  iconAcknowledgement: 'Ack Icon',
  iconDocumentSpecific: 'Doc-Specific Icon',
  iconWarehouse: 'Warehouse Icon',
  iconCredit: 'Credit Icon',
};

// Mock outside reps (in real app, would come from API)
export const AVAILABLE_OUTSIDE_REPS = [
  { id: 'or-1', name: 'John Smith' },
  { id: 'or-2', name: 'Sarah Johnson' },
  { id: 'or-3', name: 'Mike Wilson' },
  { id: 'or-4', name: 'Tom Davis' },
  { id: 'or-5', name: 'Chris Martin' },
];

// Mock inside reps (in real app, would come from API)
export const AVAILABLE_INSIDE_REPS = [
  { id: 'ir-1', name: 'Jennifer Adams' },
  { id: 'ir-2', name: 'Mark Stevens' },
  { id: 'ir-3', name: 'Rachel Green' },
  { id: 'ir-4', name: 'David Miller' },
  { id: 'ir-5', name: 'Emily Chen' },
];

// Credit types
export const CREDIT_TYPES = [
  { value: 'return', label: 'Return' },
  { value: 'short_ship', label: 'Short Ship' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'damage', label: 'Damage' },
] as const;
