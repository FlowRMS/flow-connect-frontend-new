/**
 * Statements List - Filter Configuration
 * Configuration for the AdvancedFilters component
 */

import type { FilterOption } from '../../../advancedFilters/types';

/**
 * Get sort options for the SortButton component
 * Note: columnName should match the API StatementLandingPage field names
 */
export function getStatementSortOptions() {
  return [
    { columnName: 'statementNumber', label: 'Statement Number' },
    { columnName: 'entityDate', label: 'Statement Date' },
    { columnName: 'factoryName', label: 'Factory Name' },
    { columnName: 'total', label: 'Total' },
    { columnName: 'commission', label: 'Commission' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}

/**
 * Get filter options for the AdvancedFilters component
 */
export function getStatementFilterOptions(): FilterOption[] {
  return [
    {
      id: 'statement-number',
      label: 'Statement Number',
      type: 'text' as const,
      columnName: 'statementNumber',
      available: true,
    },
    {
      id: 'factory-name',
      label: 'Factory Name',
      type: 'text' as const,
      columnName: 'factoryName',
      available: true,
    },
    {
      id: 'statement-date',
      label: 'Statement Date',
      type: 'date' as const,
      columnName: 'entityDate',
      available: true,
    },
    {
      id: 'total',
      label: 'Total',
      type: 'number' as const,
      columnName: 'total',
      available: true,
      numberFormat: 'currency' as const,
    },
    {
      id: 'commission',
      label: 'Commission',
      type: 'number' as const,
      columnName: 'commission',
      available: true,
      numberFormat: 'currency' as const,
    },
    {
      id: 'created-date',
      label: 'Created Date',
      type: 'date' as const,
      columnName: 'createdAt',
      available: true,
    },
  ];
}

/**
 * Column key to filter ID mapping for filter sync
 */
export const columnKeyToFilterId: Record<string, string> = {
  statementNumber: 'statement-number',
  factoryName: 'factory-name',
  entityDate: 'statement-date',
  total: 'total',
  commission: 'commission',
  createdAt: 'created-date',
};
