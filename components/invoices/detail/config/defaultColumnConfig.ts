/**
 * Default Column Configuration for Invoices
 * Defines the default column configuration for line items table
 */

import type { ColumnKey } from '../types';
import { COLUMN_LABELS, DEFAULT_VISIBLE_COLUMNS } from '../constants';
import type { InvoiceColumnConfig } from '@/components/lib/graphql/settings';

/**
 * Default column configuration for Invoices line items
 * Based on DEFAULT_VISIBLE_COLUMNS and COLUMN_LABELS
 */
export const defaultInvoiceColumnConfig: InvoiceColumnConfig[] = [
  { key: 'partNumber', label: COLUMN_LABELS.partNumber, visible: true, pinned: false },
  { key: 'custPartNumber', label: COLUMN_LABELS.custPartNumber, visible: true, pinned: false },
  { key: 'description', label: COLUMN_LABELS.description, visible: true, pinned: false },
  { key: 'uom', label: COLUMN_LABELS.uom, visible: true, pinned: false },
  { key: 'divisor', label: COLUMN_LABELS.divisor, visible: true, pinned: false },
  { key: 'unitPrice', label: COLUMN_LABELS.unitPrice, visible: true, pinned: false },
  { key: 'quantity', label: COLUMN_LABELS.quantity, visible: true, pinned: false },
  { key: 'sellTotal', label: COLUMN_LABELS.sellTotal, visible: true, pinned: false },
  { key: 'commissionPercent', label: COLUMN_LABELS.commissionPercent, visible: true, pinned: false },
  { key: 'commission', label: COLUMN_LABELS.commission, visible: true, pinned: false },
  { key: 'commissionTotal', label: COLUMN_LABELS.commissionTotal, visible: true, pinned: false },
  { key: 'linkedOrder', label: COLUMN_LABELS.linkedOrder, visible: true, pinned: false },
  { key: 'linkedCheck', label: COLUMN_LABELS.linkedCheck, visible: true, pinned: false },
  { key: 'percentOver', label: COLUMN_LABELS.percentOver, visible: false, pinned: false },
  { key: 'commissionAmount', label: COLUMN_LABELS.commissionAmount, visible: false, pinned: false },
  { key: 'ovgPercent', label: COLUMN_LABELS.ovgPercent, visible: false, pinned: false },
  { key: 'ovgAmount', label: COLUMN_LABELS.ovgAmount, visible: false, pinned: false },
  { key: 'earnPercent', label: COLUMN_LABELS.earnPercent, visible: false, pinned: false },
  { key: 'earnAmount', label: COLUMN_LABELS.earnAmount, visible: false, pinned: false },
];

/**
 * Default Invoice Settings Value
 */
export const defaultInvoiceSettings: {
  columnConfig: InvoiceColumnConfig[];
} = {
  columnConfig: defaultInvoiceColumnConfig,
};
