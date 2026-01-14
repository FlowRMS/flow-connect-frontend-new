/**
 * Commissions List - Filter Configuration
 * Configuration for the AdvancedFilters component
 * Note: columnName should match the API CheckLandingPage field names
 */

import type { FilterOption } from '../../../advancedFilters/types';
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
      type: 'text' as const, 
      columnName: 'checkNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: 'dropdown' as const, 
      columnName: 'status', 
      available: true, 
      options: CHECK_STATUSES 
    },
    { 
      id: 'commission-month', 
      label: 'Commission Month', 
      type: 'month' as const, 
      columnName: 'commissionMonth', 
      available: true 
    },
    { 
      id: 'post-date', 
      label: 'Post Date', 
      type: 'date' as const, 
      columnName: 'postDate', 
      available: true 
    },
    { 
      id: 'check-date', 
      label: 'Check Date', 
      type: 'date' as const, 
      columnName: 'checkDate', 
      available: true 
    },
    { 
      id: 'entry-date', 
      label: 'Entry Date', 
      type: 'date' as const, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'net-amount', 
      label: 'Commission', 
      type: 'number' as const, 
      columnName: 'enteredCommissionAmount', 
      available: true,
      numberFormat: 'currency' as const
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

