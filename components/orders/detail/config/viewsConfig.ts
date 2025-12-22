/**
 * Views Configuration
 * Predefined views for the line items table
 */

import type { ViewConfig, ColumnKey } from '../types';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from '../constants';

/**
 * Saved views for line items table
 */
export const SAVED_VIEWS: ViewConfig[] = [
  {
    id: 'default',
    name: 'Default',
    columns: DEFAULT_VISIBLE_COLUMNS,
  },
  {
    id: 'compact',
    name: 'Compact',
    columns: [
      'partNumber',
      'description',
      'quantity',
      'sellTotal',
    ] as ColumnKey[],
  },
  {
    id: 'overage',
    name: 'Overage View',
    columns: [
      'partNumber',
      'description',
      'quantity',
      'uom',
      'unitPrice',
      'percentOver',
      'sellTotal',
      'commissionPercent',
      'commissionAmount',
      'ovgPercent',
      'ovgAmount',
      'earnPercent',
      'earnAmount',
    ] as ColumnKey[],
  },
  {
    id: 'full',
    name: 'Full Details',
    columns: Object.keys(COLUMN_LABELS) as ColumnKey[],
  },
  {
    id: 'commission',
    name: 'Commission Focus',
    columns: [
      'partNumber',
      'description',
      'quantity',
      'sellTotal',
      'commissionPercent',
      'commission',
      'commissionTotal',
      'invoiced',
      'linkedInvoice',
      'linkedCheck',
    ] as ColumnKey[],
  },
  {
    id: 'fulfillment',
    name: 'Fulfillment Focus',
    columns: [
      'partNumber',
      'description',
      'quantity',
      'shippedQty',
      'lineStatus',
      'linkedFulfillment',
      'iconAcknowledgement',
      'iconWarehouse',
    ] as ColumnKey[],
  },
];

/**
 * Get view by id
 */
export const getViewById = (id: string): ViewConfig | undefined => {
  return SAVED_VIEWS.find((view) => view.id === id);
};

/**
 * Get default view
 */
export const getDefaultView = (): ViewConfig => {
  return SAVED_VIEWS[0];
};
