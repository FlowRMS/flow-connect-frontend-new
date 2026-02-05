/**
 * Customer Filter and Sort Configuration
 * Note: columnName should match the backend CustomerLandingPage field names
 */

import type { FilterOption } from '../../advancedFilters/types';

export type SortOption = {
  columnName: string;
  label: string;
};

export function getCustomerFilterOptions(
  uniqueCompanyNames: string[]
): FilterOption[] {
  return [
    {
      id: 'companyName',
      label: 'Company Name',
      type: 'text',
      columnName: 'companyName',
      available: true,
    },
    {
      id: 'isParent',
      label: 'Is Parent',
      type: 'boolean' as const,
      columnName: 'isParent',
      available: true,
    },
    {
      id: 'published',
      label: 'Published',
      type: 'boolean' as const,
      columnName: 'published',
      available: true,
    },
    {
      id: 'parent',
      label: 'Parent',
      type: 'text',
      columnName: 'parent',
      available: true,
    },
    {
      id: 'createdAt',
      label: 'Entry Date',
      type: 'date',
      columnName: 'createdAt',
      available: true,
    },
    {
      id: 'createdBy',
      label: 'Created By',
      type: 'text',
      columnName: 'createdBy',
      available: false,
    },
    {
      id: 'insideReps',
      label: 'Inside Reps',
      type: 'text',
      columnName: 'insideReps',
      available: false,
    },
    {
      id: 'outsideReps',
      label: 'Outside Reps',
      type: 'text',
      columnName: 'outsideReps',
      available: false,
    },
  ];
}

export function getCustomerSortOptions(): SortOption[] {
  return [
    { columnName: 'companyName', label: 'Company Name' },
    { columnName: 'createdAt', label: 'Entry Date' },
    { columnName: 'isParent', label: 'Is Parent' },
    { columnName: 'published', label: 'Published' },
  ];
}
