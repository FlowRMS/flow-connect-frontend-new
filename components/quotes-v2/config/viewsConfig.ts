/**
 * Views Configuration for Quotes V2
 * Predefined views for the line items table
 */

import type { LineItemColumnKey } from '../types';

export type ViewMode = 'simple' | 'overage';

export interface ViewConfig {
  id: ViewMode;
  name: string;
  columns: LineItemColumnKey[];
}

/**
 * Simple View - Basic columns for standard quoting
 */
export const SIMPLE_VIEW_COLUMNS: LineItemColumnKey[] = [
  'partNumber',
  'customerPartNumber',
  'description',
  'manufacturer',
  'quantity',
  'uom',
  'unitPrice',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
];

/**
 * Overage View - Extended columns including overage pricing and earnings
 */
export const OVERAGE_VIEW_COLUMNS: LineItemColumnKey[] = [
  'partNumber',
  'customerPartNumber',
  'description',
  'manufacturer',
  'fixtureSchedule',
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
];

/**
 * Fixture Schedule options for the editable dropdown
 */
export const FIXTURE_SCHEDULE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'TYPE_A', label: 'Type A' },
  { value: 'TYPE_B', label: 'Type B' },
  { value: 'TYPE_C', label: 'Type C' },
  { value: 'TYPE_D', label: 'Type D' },
  { value: 'TYPE_E', label: 'Type E' },
];

/**
 * Saved views for line items table
 */
export const SAVED_VIEWS: ViewConfig[] = [
  {
    id: 'simple',
    name: 'Simple View',
    columns: SIMPLE_VIEW_COLUMNS,
  },
  {
    id: 'overage',
    name: 'Overage View',
    columns: OVERAGE_VIEW_COLUMNS,
  },
];

/**
 * Get view configuration by id
 */
export const getViewById = (id: ViewMode): ViewConfig => {
  return SAVED_VIEWS.find((view) => view.id === id) || SAVED_VIEWS[0];
};

/**
 * Get columns for a specific view mode
 */
export const getColumnsForView = (viewMode: ViewMode): LineItemColumnKey[] => {
  return viewMode === 'overage' ? OVERAGE_VIEW_COLUMNS : SIMPLE_VIEW_COLUMNS;
};

/**
 * Column labels for display
 */
export const COLUMN_LABELS: Record<LineItemColumnKey, string> = {
  partNumber: 'Part #',
  customerPartNumber: 'Cust Part #',
  description: 'Description',
  manufacturer: 'Manufacturer',
  quantity: 'Qty',
  uom: 'UOM',
  divisor: 'Divisor',
  unitPrice: 'Unit Price',
  endUser: 'End User',
  sellTotal: 'Sell Total',
  commissionPercent: 'Comm %',
  commission: 'Commission',
  commissionTotal: 'Comm Total',
  linkedOrder: 'Linked Order',
  // Overage columns
  percentOver: '% Over',
  commissionAmount: 'Comm $',
  ovgPercent: 'Ovg %',
  ovgAmount: 'Ovg $',
  earnPercent: 'Earn %',
  earnAmount: 'Earn $',
  fixtureSchedule: 'Fixture Schedule',
};
