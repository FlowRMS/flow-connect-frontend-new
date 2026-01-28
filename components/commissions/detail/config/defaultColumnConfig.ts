/**
 * Default Column Configuration for Commission/Check Line Items
 * Defines default visible and pinned states for columns
 */

import type { CommissionColumnConfig, CommissionSettingsValue } from '@/components/lib/graphql/settings';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from '../constants';
import type { ColumnKey } from '../types';

// All available columns (not just visible ones)
const ALL_COLUMNS: ColumnKey[] = [
  'number',
  'orderNumber',
  'customer',
  'salesRep',
  'commissionRate',
  'expectedCommission',
  'paidCommission',
  'balance',
  'paid',
];

export const defaultCommissionColumnConfig: CommissionColumnConfig[] = ALL_COLUMNS.map(key => ({
  key,
  label: COLUMN_LABELS[key],
  visible: DEFAULT_VISIBLE_COLUMNS.includes(key), // Visible if in DEFAULT_VISIBLE_COLUMNS
  pinned: false, // Default to not pinned
}));

export const defaultCommissionSettings: CommissionSettingsValue = {
  columnConfig: defaultCommissionColumnConfig,
};
