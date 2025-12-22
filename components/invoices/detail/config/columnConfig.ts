/**
 * Column Configuration
 * Defines all available columns for the invoice line items table
 */

import type { ColumnKey } from '../types';
import { COLUMN_LABELS } from '../constants';

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  group?: 'basic' | 'linked' | 'commission' | 'overage';
}

/**
 * All available columns for invoice line items table
 */
export const LINE_ITEM_COLUMNS: ColumnDefinition[] = [
  // Basic Information
  {
    key: 'partNumber',
    label: COLUMN_LABELS.partNumber,
    width: '150px',
    align: 'left',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'custPartNumber',
    label: COLUMN_LABELS.custPartNumber,
    width: '150px',
    align: 'left',
    group: 'basic',
  },
  {
    key: 'description',
    label: COLUMN_LABELS.description,
    width: '250px',
    align: 'left',
    group: 'basic',
  },
  {
    key: 'uom',
    label: COLUMN_LABELS.uom,
    width: '80px',
    align: 'center',
    group: 'basic',
  },
  {
    key: 'divisor',
    label: COLUMN_LABELS.divisor,
    width: '80px',
    align: 'center',
    group: 'basic',
  },
  {
    key: 'unitPrice',
    label: COLUMN_LABELS.unitPrice,
    width: '120px',
    align: 'right',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'quantity',
    label: COLUMN_LABELS.quantity,
    width: '100px',
    align: 'right',
    sortable: true,
    group: 'basic',
  },

  // Linked Objects
  {
    key: 'linkedOrder',
    label: COLUMN_LABELS.linkedOrder,
    width: '120px',
    align: 'center',
    group: 'linked',
  },
  {
    key: 'linkedCheck',
    label: COLUMN_LABELS.linkedCheck,
    width: '120px',
    align: 'center',
    group: 'linked',
  },

  // Financials
  {
    key: 'sellTotal',
    label: COLUMN_LABELS.sellTotal,
    width: '120px',
    align: 'right',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'commissionPercent',
    label: COLUMN_LABELS.commissionPercent,
    width: '130px',
    align: 'right',
    group: 'commission',
  },
  {
    key: 'commission',
    label: COLUMN_LABELS.commission,
    width: '120px',
    align: 'right',
    group: 'commission',
  },
  {
    key: 'commissionTotal',
    label: COLUMN_LABELS.commissionTotal,
    width: '150px',
    align: 'right',
    sortable: true,
    group: 'commission',
  },

  // Overage
  {
    key: 'percentOver',
    label: COLUMN_LABELS.percentOver,
    width: '100px',
    align: 'right',
    group: 'overage',
  },
  {
    key: 'commissionAmount',
    label: COLUMN_LABELS.commissionAmount,
    width: '120px',
    align: 'right',
    group: 'overage',
  },
  {
    key: 'ovgPercent',
    label: COLUMN_LABELS.ovgPercent,
    width: '100px',
    align: 'right',
    group: 'overage',
  },
  {
    key: 'ovgAmount',
    label: COLUMN_LABELS.ovgAmount,
    width: '120px',
    align: 'right',
    group: 'overage',
  },
  {
    key: 'earnPercent',
    label: COLUMN_LABELS.earnPercent,
    width: '110px',
    align: 'right',
    group: 'overage',
  },
  {
    key: 'earnAmount',
    label: COLUMN_LABELS.earnAmount,
    width: '120px',
    align: 'right',
    group: 'overage',
  },
];

/**
 * Get column definition by key
 */
export const getColumnDefinition = (key: ColumnKey): ColumnDefinition | undefined => {
  return LINE_ITEM_COLUMNS.find((col) => col.key === key);
};

/**
 * Get columns by group
 */
export const getColumnsByGroup = (
  group: ColumnDefinition['group']
): ColumnDefinition[] => {
  return LINE_ITEM_COLUMNS.filter((col) => col.group === group);
};

