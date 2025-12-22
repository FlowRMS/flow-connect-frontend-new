/**
 * Invoice Detail - Constants
 * Re-exports and constants for invoice detail
 */

import type { ColumnKey } from './types';

// Re-export status labels and colors from rms types
export {
  invoiceStatusLabels,
  invoiceStatusColors,
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
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
  'linkedOrder',
  'linkedCheck',
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
  linkedOrder: 'Order #',
  linkedCheck: 'Check #',
  sellTotal: 'Sell Total',
  commissionPercent: 'Commission %',
  commission: 'Commission',
  commissionTotal: 'Commission Total',
  percentOver: '% Over',
  commissionAmount: 'Com $',
  ovgPercent: 'Ovg %',
  ovgAmount: 'Ovg $',
  earnPercent: 'Earn %',
  earnAmount: 'Earn $',
};

// Mock outside reps (in real app, would come from API)
export const AVAILABLE_OUTSIDE_REPS = [
  { id: 'or-1', name: 'Richard Utley' },
  { id: 'or-2', name: 'Mike Thompson' },
  { id: 'or-3', name: 'Sarah Williams' },
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

