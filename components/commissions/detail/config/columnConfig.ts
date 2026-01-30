/**
 * Column Configuration
 * Defines all available columns for the check line items table
 */

import type { ColumnKey } from '../types';
import { COLUMN_LABELS } from '../constants';

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  group?: 'basic' | 'financial' | 'status';
}

/**
 * All available columns for check line items table
 */
export const LINE_ITEM_COLUMNS: ColumnDefinition[] = [
  // Basic Information
  {
    key: 'number',
    label: COLUMN_LABELS.number,
    width: '150px',
    align: 'left',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'orderNumber',
    label: COLUMN_LABELS.orderNumber,
    width: '150px',
    align: 'left',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'customer',
    label: COLUMN_LABELS.customer,
    width: '200px',
    align: 'left',
    sortable: true,
    group: 'basic',
  },
  {
    key: 'salesRep',
    label: COLUMN_LABELS.salesRep,
    width: '150px',
    align: 'left',
    sortable: true,
    group: 'basic',
  },

  // Financial Information
  {
    key: 'commissionRate',
    label: COLUMN_LABELS.commissionRate,
    width: '150px',
    align: 'left',
    group: 'financial',
  },
  {
    key: 'expectedCommission',
    label: COLUMN_LABELS.expectedCommission,
    width: '180px',
    align: 'left',
    sortable: true,
    group: 'financial',
  },
  {
    key: 'paidCommission',
    label: COLUMN_LABELS.paidCommission,
    width: '180px',
    align: 'left',
    sortable: true,
    group: 'financial',
  },
  {
    key: 'balance',
    label: COLUMN_LABELS.balance,
    width: '150px',
    align: 'left',
    sortable: true,
    group: 'financial',
  },

];

/**
 * Get column definition by key
 */
export const getColumnDefinition = (
  key: ColumnKey
): ColumnDefinition | undefined => {
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

