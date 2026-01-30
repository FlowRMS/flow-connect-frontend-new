/**
 * Check Detail - Constants
 * Constants for check detail component
 */

import type { CheckStatus, ColumnKey } from './types';

// Check status labels (different from CommissionCheck status)
export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  posted: 'Posted',
  unposted: 'Unposted',
};

// Check status colors
export const CHECK_STATUS_COLORS: Record<CheckStatus, string> = {
  posted: 'bg-blue-100 text-blue-700',
  unposted: 'bg-gray-100 text-gray-700',
};

// Default visible columns for line items table
export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  'number',
  'orderNumber',
  'customer',
  'salesRep',
  'commissionRate',
  'expectedCommission',
  'paidCommission',
  'balance',
];

// Column labels
export const COLUMN_LABELS: Record<ColumnKey, string> = {
  number: 'Number',
  orderNumber: 'Order Number',
  customer: 'Customer',
  salesRep: 'Sales Rep',
  commissionRate: 'Commission Rate',
  expectedCommission: 'Expected Commission',
  paidCommission: 'Stated Commission',
  balance: 'Balance',
};

