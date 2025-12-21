/**
 * Column Configuration
 * Defines all available columns for the line items table
 */

import type { ColumnKey } from '../types';
import { COLUMN_LABELS } from '../constants';

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  group?: 'basic' | 'status' | 'linked' | 'commission' | 'overage' | 'icons';
}

/**
 * All available columns for line items table
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
  {
    key: 'shippedQty',
    label: COLUMN_LABELS.shippedQty,
    width: '120px',
    align: 'right',
    group: 'basic',
  },

  // Status
  {
    key: 'lineStatus',
    label: COLUMN_LABELS.lineStatus,
    width: '120px',
    align: 'center',
    group: 'status',
  },

  // Linked Objects
  {
    key: 'linkedQuote',
    label: COLUMN_LABELS.linkedQuote,
    width: '120px',
    align: 'center',
    group: 'linked',
  },
  {
    key: 'linkedInvoice',
    label: COLUMN_LABELS.linkedInvoice,
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
  {
    key: 'linkedFulfillment',
    label: COLUMN_LABELS.linkedFulfillment,
    width: '140px',
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
  {
    key: 'invoiced',
    label: COLUMN_LABELS.invoiced,
    width: '120px',
    align: 'right',
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

  // Icons
  {
    key: 'iconAcknowledgement',
    label: COLUMN_LABELS.iconAcknowledgement,
    width: '50px',
    align: 'center',
    group: 'icons',
  },
  {
    key: 'iconDocumentSpecific',
    label: COLUMN_LABELS.iconDocumentSpecific,
    width: '50px',
    align: 'center',
    group: 'icons',
  },
  {
    key: 'iconWarehouse',
    label: COLUMN_LABELS.iconWarehouse,
    width: '50px',
    align: 'center',
    group: 'icons',
  },
  {
    key: 'iconCredit',
    label: COLUMN_LABELS.iconCredit,
    width: '50px',
    align: 'center',
    group: 'icons',
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
