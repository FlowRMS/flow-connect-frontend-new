/**
 * Commissions List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API CheckLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
import { ColumnFilterTypeEnum } from '../../../advancedFilters/types';
import type { CheckStatus } from '@/components/lib/graphql/checks';

// Check status options matching CheckStatus type
export const CHECK_STATUSES: CheckStatus[] = [
  'OPEN',
  'POSTED',
];

/**
 * Get filter options for the AdvancedFilters component
 * Note: columnName should match the API CheckLandingPage field names
 */
export function getCommissionFilterOptions(): FilterOption[] {
  return [
    { 
      id: 'check-number', 
      label: 'Check Number', 
    type: ColumnFilterTypeEnum.text, 
      columnName: 'checkNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
    type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'status', 
      available: true, 
      options: CHECK_STATUSES 
    },
    { 
      id: 'commission-month', 
      label: 'Commission Month', 
    type: ColumnFilterTypeEnum.month, 
      columnName: 'commissionMonth', 
      available: true 
    },
    { 
      id: 'post-date', 
      label: 'Post Date', 
    type: ColumnFilterTypeEnum.date, 
      columnName: 'postDate', 
      available: true 
    },
    { 
      id: 'check-date', 
      label: 'Check Date', 
    type: ColumnFilterTypeEnum.date, 
      columnName: 'checkDate', 
      available: true 
    },
    { 
      id: 'entry-date', 
      label: 'Entry Date', 
    type: ColumnFilterTypeEnum.date, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'net-amount', 
      label: 'Commission', 
    type: ColumnFilterTypeEnum.number, 
      columnName: 'enteredCommissionAmount', 
      available: true,
      numberFormat: 'currency' as const
    },
    // Soon filters (not yet available in API)
    { 
      id: 'factory-name', 
      label: 'Factory Name', 
    type: ColumnFilterTypeEnum.text, 
      columnName: 'factoryName', 
      available: false 
    },
  ];
}

/**
 * Get sort options for the SortButton component
 */
export function getCommissionSortOptions() {
  return [
    { columnName: 'checkNumber', label: 'Check Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'commissionMonth', label: 'Commission Month' },
    { columnName: 'postDate', label: 'Post Date' },
    { columnName: 'checkDate', label: 'Check Date' },
    { columnName: 'createdAt', label: 'Entry Date' },
    { columnName: 'enteredCommissionAmount', label: 'Commission' },
  ];
}