/**
 * Statements List - Column Configuration
 * Configuration for table columns and Excel export
 */

import type { ColumnConfig } from '../../types';

/**
 * Table column configuration
 * Defines width, labels, sortability, and export types for each column
 */
export const STATEMENT_TABLE_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', width: '40px', label: '', sortable: false, filterable: false, align: 'center' },
  { id: 'statementNumber', width: '150px', label: 'Statement #', sortable: true, filterable: true, exportType: 'text' },
  { id: 'factoryName', width: '180px', label: 'Factory', sortable: true, filterable: true, exportType: 'text' },
  { id: 'statementDate', width: '130px', label: 'Date', sortable: true, filterable: true, exportType: 'date', apiField: 'entityDate' },
  { id: 'total', width: '130px', label: 'Total', sortable: true, filterable: true, align: 'right', exportType: 'currency' },
  { id: 'commission', width: '130px', label: 'Commission', sortable: true, filterable: true, align: 'right', exportType: 'currency' },
  { id: 'createdBy', width: '150px', label: 'Created By', sortable: false, filterable: false, exportType: 'text' },
  { id: 'createdAt', width: '130px', label: 'Entry Date', sortable: true, filterable: true, exportType: 'date' },
];

/**
 * Get grid template columns string for the table
 */
export const getGridTemplateColumns = (): string => {
  return STATEMENT_TABLE_COLUMNS.map((col) => col.width).join(' ');
};
