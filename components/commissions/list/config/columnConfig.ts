/**
 * Commissions List - Column Configuration
 * Configuration for table columns
 */

import type { ColumnConfig } from '../types';

/**
 * Table column configuration
 * Defines width, labels, sortability, filterability, and alignment for each column
 * 
 * Grid layout: [40px preview] [auto checkbox] [1fr columns...]
 * Total: 11 columns (preview + checkbox + 9 data columns)
 */
export const COMMISSION_TABLE_COLUMNS: ColumnConfig[] = [
  { id: 'preview', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'checkbox', width: 'auto', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'checkNumber', width: '1fr', label: 'Check Number', sortable: true, filterable: true },
  { id: 'status', width: '1fr', label: 'Posted Status', sortable: true, filterable: true },
  { id: 'netAmount', width: '1fr', label: 'Commission', sortable: true, filterable: false },
  { id: 'commissionMonth', width: '1fr', label: 'Commission Month', sortable: true, filterable: true },
  { id: 'manufacturerName', width: '1fr', label: 'Factory', sortable: true, filterable: true },
  { id: 'postDate', width: '1fr', label: 'Post Date', sortable: true, filterable: true },
  { id: 'checkDate', width: '1fr', label: 'Check Date', sortable: true, filterable: true },
  { id: 'entryDate', width: '1fr', label: 'Entry Date', sortable: true, filterable: true },
  { id: 'checkBalance', width: '1fr', label: 'Check Balance', sortable: true, filterable: false, align: 'right' },
];

/**
 * Get grid template columns string for the table
 * Uses CSS grid layout with the widths defined above
 */
export const getGridTemplateColumns = (): string => {
  return '40px auto 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr';
};

