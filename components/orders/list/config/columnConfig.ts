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
  { id: 'orderNumber', width: '140px', label: 'Order #', sortable: true, filterable: true, exportType: 'text' },
  { id: 'totalCommission', width: '140px', label: 'Commission', sortable: true, filterable: true, align: 'right', exportType: 'currency', apiField: 'commission' },
  { id: 'status', width: '130px', label: 'Status', sortable: true, filterable: true, exportType: 'text' },
  { id: 'total', width: '120px', label: 'Amount', sortable: true, filterable: true, align: 'right', exportType: 'currency' },
  { id: 'orderDate', width: '130px', label: 'Order Date', sortable: true, filterable: true, exportType: 'date', apiField: 'entityDate' },
  // Entry Date uses createdAt (audit field) from the landing page
  { id: 'entryDate', width: '130px', label: 'Entry Date', sortable: true, filterable: false, exportType: 'date', apiField: 'createdAt' },
  { id: 'createdBy', width: '140px', label: 'Created By', sortable: false, filterable: false, exportType: 'text' },
  { id: 'shipDate', width: '90px', label: 'Ship Date', sortable: false, filterable: false, exportType: 'date' },
  { id: 'dueDate', width: '90px', label: 'Due Date', sortable: false, filterable: false, exportType: 'date' },
  { id: 'manufacturerName', width: '140px', label: 'Factory', sortable: true, filterable: true, exportType: 'text', apiField: 'factoryName' },
  { id: 'customerName', width: '140px', label: 'Customer', sortable: true, filterable: true, exportType: 'text', apiField: 'soldToCustomerName' },
  { id: 'jobName', width: '180px', label: 'Job Name', sortable: false, filterable: false, exportType: 'text' },
  { id: 'visible', width: '50px', label: 'Visible', sortable: false, filterable: false, align: 'center', exportType: 'text', apiField: 'published' },
];

/**
 * Get grid template columns string for the table
 */
export const getGridTemplateColumns = (): string => {
  return ORDER_TABLE_COLUMNS.map((col) => col.width).join(' ');
};
