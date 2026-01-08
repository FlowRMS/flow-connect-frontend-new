/**
 * Orders List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API OrderLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
import { OrderStatus } from '../types';

// Order status options matching OrderStatus enum
export const ORDER_STATUSES: OrderStatus[] = [
  'OPEN',
  'PARTIAL_SHIPPED',
  'SHIPPED_COMPLETE',
  'CANCELLED',
  'OVER_SHIPPED',
  'PARTIAL_CANCELLED',
  'OVER_CANCELLED',
];

/**
 * Get sort options for the SortButton component
 * Note: columnName should match the API OrderLandingPage field names
 */
export function getOrderSortOptions() {
  return [
    { columnName: 'orderNumber', label: 'Order Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'entityDate', label: 'Order Date' },
    { columnName: 'total', label: 'Total' },
    { columnName: 'commission', label: 'Commission' },
    // Soon options
    { columnName: 'soldToCustomerName', label: 'Customer Name' }, // Soon
    { columnName: 'factoryName', label: 'Factory Name' }, // Soon
  ];
}

/**
 * Get filter options for the AdvancedFilters component
 */
export const getOrderFilterOptions = (): FilterOption[] => [
  { 
    id: 'order-number', 
    label: 'Order Number', 
    type: 'text' as const, 
    columnName: 'orderNumber', 
    available: true 
  },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'dropdown' as const, 
    columnName: 'status', 
    available: true, 
    options: ORDER_STATUSES 
  },
  { 
    id: 'commission', 
    label: 'Commission', 
    type: 'number' as const, 
    columnName: 'commission', 
    available: true 
  },
  { 
    id: 'job-name', 
    label: 'Job Name', 
    type: 'text' as const, 
    columnName: 'jobName', 
    available: true 
  },
  { 
    id: 'order-date', 
    label: 'Order Date', 
    type: 'date' as const, 
    columnName: 'entityDate', 
    available: true 
  },
  { 
    id: 'published', 
    label: 'Published', 
    type: 'dropdown' as const, 
    columnName: 'published', 
    available: true, 
    options: ['true', 'false'] 
  },
  { 
    id: 'total', 
    label: 'Total', 
    type: 'number' as const, 
    columnName: 'total', 
    available: true 
  },
  // Soon filters
  { 
    id: 'factory-name', 
    label: 'Factory Name', 
    type: 'dropdown' as const, 
    columnName: 'factoryName', 
    available: false 
  },
  { 
    id: 'customer-name', 
    label: 'Customer Name', 
    type: 'text' as const, 
    columnName: 'soldToCustomerName', 
    available: false 
  },
];
