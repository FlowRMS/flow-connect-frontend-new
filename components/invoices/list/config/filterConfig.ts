/**
 * Invoices List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API InvoiceLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
import type { InvoiceStatus } from '@/lib/types/rms';

// Invoice status options matching InvoiceStatus type
export const INVOICE_STATUSES: InvoiceStatus[] = [
  'open',
  'paid',
  'partial_paid',
  'void',
  'dormant',
];

/**
 * Get sort options for the SortButton component
 * Note: columnName should match the API InvoiceLandingPage field names
 */
export function getInvoiceSortOptions() {
  return [
    { columnName: 'invoiceNumber', label: 'Invoice Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'entityDate', label: 'Invoice Date' },
    { columnName: 'dueDate', label: 'Due Date' },
    { columnName: 'total', label: 'Total' },
    { columnName: 'commission', label: 'Commission' },
    { columnName: 'orderNumber', label: 'Order Number' },
    { columnName: 'published', label: 'Published' },
    // Soon options
    { columnName: 'factoryName', label: 'Factory Name' }, // Soon
  ];
}

/**
 * Get filter options for the AdvancedFilters component
 * Note: columnName should match the API InvoiceLandingPage field names
 */
export function getInvoiceFilterOptions(): FilterOption[] {
  return [
    { 
      id: 'invoice-number', 
      label: 'Invoice Number', 
      type: 'text' as const, 
      columnName: 'invoiceNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: 'dropdown' as const, 
      columnName: 'status', 
      available: true, 
      options: INVOICE_STATUSES 
    },
    { 
      id: 'invoice-date', 
      label: 'Invoice Date', 
      type: 'date' as const, 
      columnName: 'entityDate', 
      available: true 
    },
    { 
      id: 'due-date', 
      label: 'Due Date', 
      type: 'date' as const, 
      columnName: 'dueDate', 
      available: true 
    },
    { 
      id: 'total', 
      label: 'Total', 
      type: 'number' as const, 
      columnName: 'total', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'commission', 
      label: 'Commission', 
      type: 'number' as const, 
      columnName: 'commission', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'created-date', 
      label: 'Entry Date', 
      type: 'date' as const, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'order-number', 
      label: 'Order Number', 
      type: 'text' as const, 
      columnName: 'orderNumber', 
      available: true 
    },
    { 
      id: 'published', 
      label: 'Published', 
      type: 'boolean' as const, 
      columnName: 'published', 
      available: true 
    },
    // Soon filters (not yet available in API)
    { 
      id: 'factory-name', 
      label: 'Factory Name', 
      type: 'text' as const, 
      columnName: 'factoryName', 
      available: false 
    },
  ];
}

