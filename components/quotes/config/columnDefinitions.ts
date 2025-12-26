import type { ColumnKey, ColumnDefinition } from '../types';

export const columnDefinitions: ColumnDefinition[] = [
  // Basic columns
  { key: 'partNumber', label: 'Part #', group: 'Basic', sortable: true, filterable: true },
  { key: 'customerPartNumber', label: 'Cust Part #', group: 'Basic', sortable: true, filterable: true },
  { key: 'description', label: 'Description', group: 'Basic', sortable: true, filterable: true },
  { key: 'manufacturer', label: 'Manufacturer', group: 'Basic', sortable: true, filterable: true },
  { key: 'quantity', label: 'Qty', group: 'Basic', sortable: true },
  { key: 'uom', label: 'UOM', group: 'Basic', sortable: true },
  { key: 'divisor', label: 'Divisor', group: 'Basic', sortable: true },

  // Pricing columns
  { key: 'unitPrice', label: 'Unit Price', group: 'Pricing', sortable: true },
  { key: 'sellTotal', label: 'Sell Total', group: 'Pricing', sortable: true },
  { key: 'l1', label: 'L1', group: 'Pricing', sortable: true },
  { key: 'l2', label: 'L2', group: 'Pricing', sortable: true },
  { key: 'l3', label: 'L3', group: 'Pricing', sortable: true },

  // Commission columns
  { key: 'overage', label: 'Overage %', group: 'Commission', sortable: true },
  { key: 'overageAmt', label: 'Overage $', group: 'Commission', sortable: true },
  { key: 'commRate', label: 'Comm Rate', group: 'Commission', sortable: true },
  { key: 'baseComm', label: 'Base Comm', group: 'Commission', sortable: true },
  { key: 'overageShare', label: 'Ovg Share', group: 'Commission', sortable: true },
  { key: 'overageComm', label: 'Ovg Comm', group: 'Commission', sortable: true },
  { key: 'totalEarn', label: 'Total Earn', group: 'Commission', sortable: true },
  { key: 'effRate', label: 'Eff Rate', group: 'Commission', sortable: true },
  { key: 'outsideReps', label: 'Outside Reps', group: 'Commission', sortable: false },

  // Discount columns
  { key: 'commissionDiscountPercent', label: 'Comm Disc %', group: 'Discounts', sortable: true },
  { key: 'commissionDiscountAmount', label: 'Comm Disc $', group: 'Discounts', sortable: true },
  { key: 'lineDiscountPercent', label: 'Line Disc %', group: 'Discounts', sortable: true },
  { key: 'lineDiscountAmount', label: 'Line Disc $', group: 'Discounts', sortable: true },

  // Other columns
  { key: 'endUser', label: 'End User', group: 'Other', sortable: true, filterable: true },
  { key: 'linkedOrder', label: 'Linked Order', group: 'Other', sortable: true },
  { key: 'trend', label: 'Trend', group: 'Other', sortable: false },
  { key: 'specSheet', label: 'Spec Sheet', group: 'Other', sortable: false },
  { key: 'leadTime', label: 'Lead Time', group: 'Other', sortable: true },
];

// Default visible columns for different view modes
export const defaultOverageViewColumns: ColumnKey[] = [
  'partNumber',
  'description',
  'manufacturer',
  'quantity',
  'unitPrice',
  'sellTotal',
  'overage',
  'overageAmt',
  'commRate',
  'baseComm',
  'overageShare',
  'overageComm',
  'totalEarn',
  'effRate',
  'trend',
];

export const defaultSimpleViewColumns: ColumnKey[] = [
  'partNumber',
  'description',
  'manufacturer',
  'quantity',
  'unitPrice',
  'sellTotal',
  'l1',
  'l2',
  'specSheet',
];

// Editable columns for inline editing
export const editableColumns: ColumnKey[] = ['unitPrice', 'overage', 'l1', 'l2'];

// Column groups for the column picker
export const columnGroups = [
  { name: 'Basic', columns: ['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor'] },
  { name: 'Pricing', columns: ['unitPrice', 'sellTotal', 'l1', 'l2', 'l3'] },
  { name: 'Commission', columns: ['overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps'] },
  { name: 'Discounts', columns: ['commissionDiscountPercent', 'commissionDiscountAmount', 'lineDiscountPercent', 'lineDiscountAmount'] },
  { name: 'Other', columns: ['endUser', 'linkedOrder', 'trend', 'specSheet', 'leadTime'] },
];
