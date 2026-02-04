/**
 * Adjustments List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API AdjustmentLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
import { ColumnFilterTypeEnum } from '../../../advancedFilters/types';
import type { AdjustmentStatus } from '@/components/orders/api/adjustmentsApi';

// Adjustment status options matching AdjustmentStatus type
export const ADJUSTMENT_STATUSES: AdjustmentStatus[] = [
  'PENDING',
  'POSTED',
];

/**
 * Get sort options for the SortButton component
 * Note: columnName should match the API AdjustmentLandingPage field names
 */
export function getAdjustmentSortOptions() {
  return [
    { columnName: 'adjustmentNumber', label: 'Adjustment Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'entityDate', label: 'Adjustment Date' },
    { columnName: 'amount', label: 'Amount' },
    { columnName: 'createdAt', label: 'Entry Date' },
    { columnName: 'reason', label: 'Reason' },
  ];
}

/**
 * Get filter options for the AdvancedFilters component
 * Note: columnName should match the API AdjustmentLandingPage field names
 */
export function getAdjustmentFilterOptions(): FilterOption[] {
  return [
    { 
      id: 'adjustment-number', 
      label: 'Adjustment Number', 
      type: ColumnFilterTypeEnum.text, 
      columnName: 'adjustmentNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'status', 
      available: true, 
      options: ADJUSTMENT_STATUSES 
    },
    { 
      id: 'amount', 
      label: 'Amount', 
      type: ColumnFilterTypeEnum.number, 
      columnName: 'amount', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'adjustment-date', 
      label: 'Adjustment Date', 
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
      id: 'locked', 
      label: 'Locked', 
      type: ColumnFilterTypeEnum.boolean, 
      columnName: 'locked', 
      available: true
    },
  ];
}
