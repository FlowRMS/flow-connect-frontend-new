/**
 * Pre-Opportunity Filter and Sort Configuration
 * Note: columnName should match the PreOpportunityLandingPage type field names
 */

import { SortOption } from '@/components/lib/filter-utils';
import { ColumnFilterTypeEnum, FilterOption } from '../../advancedFilters/types';

export function getPreOppFilterOptions(
  uniqueEntityNumbers: string[],
  uniqueStatuses: string[],
  uniqueCreatedBy: string[]
): FilterOption[] {
  return [
    {
      id: 'entity-number',
      label: 'Entity Number',
      type: 'dropdown',
      columnName: 'entityNumber',
      available: true,
      options: uniqueEntityNumbers
    },
    {
      id: 'status',
      label: 'Status',
      type: ColumnFilterTypeEnum.picklist,
      columnName: 'status',
      available: true,
      picklistKey: 'preOpportunityStatus',
      multiSelect: true
    },
    {
      id: 'created-by',
      label: 'Created By',
      type: 'dropdown',
      columnName: 'createdBy',
      available: true,
      options: uniqueCreatedBy
    },
    {
      id: 'total-min',
      label: 'Min Total',
      type: 'number',
      columnName: 'total',
      available: false
    },
    {
      id: 'total-max',
      label: 'Max Total',
      type: 'number',
      columnName: 'total',
      available: false
    },
  ];
}

export function getPreOppSortOptions(): SortOption[] {
  return [
    { columnName: 'entityNumber', label: 'Entity Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'total', label: 'Total Value' },
    { columnName: 'entityDate', label: 'Entity Date' },
    { columnName: 'expDate', label: 'Expiration Date' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
