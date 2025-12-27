import type { SavedView, ColumnKey } from '../types';

// EXACT match of inline savedViews from QuotesContent.tsx
export const defaultSavedViews: SavedView[] = [
  { id: 'default', name: 'Default', columns: ['partNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal'] as ColumnKey[] },
  { id: 'compact', name: 'Compact', columns: ['partNumber', 'description', 'quantity', 'unitPrice', 'sellTotal'] as ColumnKey[] },
  { id: 'earnings', name: 'Earnings View', columns: ['partNumber', 'description', 'quantity', 'manufacturer', 'unitPrice', 'sellTotal', 'commissionPercent', 'commissionTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate'] as ColumnKey[] },
  { id: 'pricing', name: 'Full Pricing', columns: ['partNumber', 'description', 'quantity', 'manufacturer', 'unitPrice', 'sellTotal', 'overage', 'overageAmt', 'l1', 'l2', 'l3', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'trend'] as ColumnKey[] },
  { id: 'approval', name: 'Approval Focus', columns: ['partNumber', 'description', 'manufacturer', 'unitPrice', 'sellTotal', 'commRate', 'totalEarn'] as ColumnKey[] },
];
