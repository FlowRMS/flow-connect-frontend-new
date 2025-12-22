/**
 * Orders List - Filter Configuration
 * Configuration for the AdvancedFilters component
 */

import type { FilterOption } from '../types';

/**
 * Get filter options for the AdvancedFilters component
 */
export const getOrderFilterOptions = (): FilterOption[] => [
  { id: 'order-number', label: 'Order Number', type: 'text' },
  { id: 'customer', label: 'Customer', type: 'dropdown' },
  { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' },
  { id: 'sales-rep', label: 'Sales Rep', type: 'dropdown' },
  { id: 'order-date', label: 'Order Date', type: 'date' },
  { id: 'status', label: 'Status', type: 'dropdown' },
];
