/**
 * Orders List - Column Configuration
 * Configuration for table columns
 */

import type { ColumnConfig } from '../types';

/**
 * Table column configuration
 * Defines width, labels, sortability, and alignment for each column
 */
export const ORDER_TABLE_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'preview', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'orderNumber', width: '120px', label: 'Order #', sortable: true, filterable: true },
  { id: 'factorySo', width: '100px', label: 'Factory SO', sortable: false, filterable: false },
  { id: 'status', width: '100px', label: 'Status', sortable: true, filterable: true },
  { id: 'total', width: '100px', label: 'Amount', sortable: true, filterable: true, align: 'right' },
  { id: 'orderDate', width: '90px', label: 'Order Date', sortable: true, filterable: true },
  { id: 'entryDate', width: '90px', label: 'Entry Date', sortable: false, filterable: false },
  { id: 'shipDate', width: '90px', label: 'Ship Date', sortable: false, filterable: false },
  { id: 'dueDate', width: '90px', label: 'Due Date', sortable: false, filterable: false },
  { id: 'manufacturerName', width: '140px', label: 'Factory', sortable: true, filterable: true },
  { id: 'customerName', width: '140px', label: 'Customer', sortable: true, filterable: true },
  { id: 'insideRep', width: '100px', label: 'Inside Rep', sortable: false, filterable: false },
  { id: 'outsideReps', width: '120px', label: 'Outside Reps', sortable: false, filterable: false },
  { id: 'totalCommission', width: '120px', label: 'Commission', sortable: true, filterable: true, align: 'right' },
  { id: 'jobName', width: '1fr', label: 'Job Name', sortable: false, filterable: false },
  { id: 'visible', width: '60px', label: 'Visible', sortable: false, filterable: false, align: 'center' },
];

/**
 * Get grid template columns string for the table
 */
export const getGridTemplateColumns = (): string => {
  return ORDER_TABLE_COLUMNS.map((col) => col.width).join(' ');
};
