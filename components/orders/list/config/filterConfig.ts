/**
 * Orders List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API OrderLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
import { ColumnFilterTypeEnum } from '../../../advancedFilters/types';
import { OrderStatus } from '../constants';

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
 * Note: columnName should match the API OrderLandingPage field names
 */
export function getOrderFilterOptions(
  uniqueOrderNumbers: string[] = [],
  uniqueCustomers: string[] = []
): FilterOption[] {
  return [
  { 
    id: 'order-number', 
    label: 'Order Number', 
    type: ColumnFilterTypeEnum.text, 
    columnName: 'orderNumber', 
    available: true 
  },
  { 
    id: 'status', 
    label: 'Status', 
    type: ColumnFilterTypeEnum.dropdown, 
    columnName: 'status', 
    available: true, 
    options: ORDER_STATUSES 
  },
  { 
    id: 'order-type', 
    label: 'Order Type', 
    type: ColumnFilterTypeEnum.picklist, 
    columnName: 'orderType', 
    available: true,
    picklistKey: 'orderTypes',
    multiSelect: false
  },
  { 
    id: 'total', 
    label: 'Total', 
    type: ColumnFilterTypeEnum.number, 
    columnName: 'total', 
    available: true,
    numberFormat: 'currency' as const
  },
  { 
    id: 'commission', 
    label: 'Commission', 
    type: ColumnFilterTypeEnum.number, 
    columnName: 'commission', 
    available: true,
    numberFormat: 'currency' as const
  },
  { 
    id: 'order-date', 
    label: 'Order Date', 
    type: ColumnFilterTypeEnum.date, 
    columnName: 'entityDate', 
    available: true 
  },
  { 
    id: 'created-date', 
    label: 'Entry Date', 
    type: ColumnFilterTypeEnum.date, 
    columnName: 'createdAt', 
    available: true 
  },
  { 
    id: 'job-name', 
    label: 'Job Name', 
    type: ColumnFilterTypeEnum.text, 
    columnName: 'jobName', 
    available: true 
  },
  {
    id: 'published',
    label: 'Published',
    type: ColumnFilterTypeEnum.boolean,
    columnName: 'published',
    available: true
  },
  {
    id: 'created-by',
    label: 'Created By',
    type: ColumnFilterTypeEnum.user,
    columnName: 'createdBy',
    available: true
  },
  // Soon filters
  { 
    id: 'factory-name', 
    label: 'Factory Name', 
    type: ColumnFilterTypeEnum.factory, 
    columnName: 'factoryName', 
    available: true 
  },
  { 
    id: 'customer-name', 
    label: 'Customer Name', 
    type: ColumnFilterTypeEnum.text, 
    columnName: 'soldToCustomerName', 
    available: false 
  },
  ];
}
