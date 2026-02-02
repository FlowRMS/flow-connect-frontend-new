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
  { id: 'invoiceNumber', width: '120px', label: 'Invoice #', sortable: true, filterable: true, exportType: 'text' },
  { id: 'status', width: '80px', label: 'Status', sortable: true, filterable: true, exportType: 'text' },
  { id: 'orderNumber', width: '100px', label: 'Order #', sortable: false, filterable: false, exportType: 'text' },
  { id: 'invoiceDate', width: '90px', label: 'Invoice Date', sortable: true, filterable: true, exportType: 'date', apiField: 'entityDate' },
  { id: 'total', width: '100px', label: 'Inv Amount', sortable: true, filterable: true, align: 'right', exportType: 'currency' },
  { id: 'totalCommission', width: '100px', label: 'Comm Amount', sortable: false, filterable: false, align: 'right', exportType: 'currency', apiField: 'commission' },
  { id: 'manufacturerName', width: '140px', label: 'Factory', sortable: true, filterable: true, exportType: 'text', apiField: 'factoryName' },
  { id: 'entryDate', width: '90px', label: 'Entry Date', sortable: false, filterable: false, exportType: 'date', apiField: 'createdAt' },
  { id: 'createdBy', width: '140px', label: 'Created By', sortable: false, filterable: false, exportType: 'text' },
  { id: 'dueDate', width: '90px', label: 'Due Date', sortable: true, filterable: true, exportType: 'date' },
  { id: 'paid', width: '60px', label: 'Paid', sortable: false, filterable: false, align: 'center', exportType: 'text' },
  { id: 'locked', width: '60px', label: 'Locked', sortable: false, filterable: false, align: 'center', exportType: 'text' },
];

/**
 * Get grid template columns string for the table
 */
export const getGridTemplateColumns = (): string => {
  return INVOICE_TABLE_COLUMNS.map((col) => col.width).join(' ');
};

