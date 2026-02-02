/**
 * Quotes V2 List - Column Configuration
 * Configuration for table columns
 */

import type { ColumnConfig } from '../types';

/**
 * Column configuration for Excel export
 * Currently only used for export functionality
 * Will be extended later for table rendering, sorts, and filters
 */

import type { ColumnConfig } from '../types';

export const QUOTE_TABLE_COLUMNS: ColumnConfig[] = [
  { id: 'quoteNumber', label: 'Quote Number', exportType: 'text' },
  { id: 'soldToCustomerName', label: 'Customer', exportType: 'text' },
  { id: 'partNumbers', label: 'Part Numbers', exportType: 'array' },
  { id: 'salesReps', label: 'Reps', exportType: 'array' },
  { id: 'factories', label: 'Factories', exportType: 'array' },
  { id: 'endUsers', label: 'End Users', exportType: 'array' },
  { id: 'categories', label: 'Categories', exportType: 'array' },
  { id: 'status', label: 'Status', exportType: 'text' },
  { id: 'pipelineStage', label: 'Pipeline Stage', exportType: 'text' },
  { id: 'quoteAmount', label: 'Total', exportType: 'currency', apiField: 'total' },
  { id: 'commission', label: 'Commission', exportType: 'currency' },
  { id: 'quoteDate', label: 'Quote Date', exportType: 'date', apiField: 'entityDate' },
  { id: 'expirationDate', label: 'Expiration Date', exportType: 'date', apiField: 'expDate' },
  { id: 'entryDate', label: 'Entry Date', exportType: 'date', apiField: 'createdAt' },
  { id: 'createdBy', label: 'Created By', exportType: 'text' },
  { id: 'published', label: 'Published', exportType: 'text' },
];
