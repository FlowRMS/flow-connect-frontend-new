/**
 * Invoices List - Filter Configuration
 * Configuration for the AdvancedFilters component
 */

import type { FilterOption } from '../types';

/**
 * Get filter options for the AdvancedFilters component
 */
export const getInvoiceFilterOptions = (): FilterOption[] => [
  { id: 'invoice-number', label: 'Invoice Number', type: 'text' },
  { id: 'customer', label: 'Customer', type: 'dropdown' },
  { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' },
  { id: 'invoice-date', label: 'Invoice Date', type: 'date' },
  { id: 'due-date', label: 'Due Date', type: 'date' },
  { id: 'status', label: 'Status', type: 'dropdown' },
];

