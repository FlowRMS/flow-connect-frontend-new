/**
 * Invoices List - Column Configuration
 * Configuration for table columns
 */

import type { ColumnConfig } from '../types';

/**
 * Table column configuration
 * Defines width, labels, sortability, and alignment for each column
 */
export const INVOICE_TABLE_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'preview', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'invoiceNumber', width: '120px', label: 'Invoice #', sortable: true, filterable: true },
  { id: 'status', width: '80px', label: 'Status', sortable: true, filterable: true },
  { id: 'orderNumber', width: '100px', label: 'Order #', sortable: false, filterable: false },
  { id: 'invoiceDate', width: '90px', label: 'Invoice Date', sortable: true, filterable: true },
  { id: 'total', width: '100px', label: 'Inv Amount', sortable: true, filterable: true, align: 'right' },
  { id: 'totalCommission', width: '100px', label: 'Comm Amount', sortable: false, filterable: false, align: 'right' },
  { id: 'manufacturerName', width: '120px', label: 'Factory', sortable: true, filterable: true },
  { id: 'insideRep', width: '100px', label: 'Inside Rep', sortable: false, filterable: false },
  { id: 'outsideReps', width: '120px', label: 'Outside Reps', sortable: false, filterable: false },
  { id: 'entryDate', width: '90px', label: 'Entry Date', sortable: false, filterable: false },
  { id: 'dueDate', width: '90px', label: 'Due Date', sortable: true, filterable: true },
  { id: 'paid', width: '60px', label: 'Paid', sortable: false, filterable: false, align: 'center' },
];

/**
 * Get grid template columns string for the table
 */
export const getGridTemplateColumns = (): string => {
  return INVOICE_TABLE_COLUMNS.map((col) => col.width).join(' ');
};

