/**
 * Filter Configuration for Companies
 * Note: columnName should match the UI Company type field names
 */

import type { FilterOption, SortOption } from '../../lib/filter-utils';

export function getCompanyFilterOptions(
  uniqueCompanyNames: string[],
  uniqueCompanyTypes: string[],
  uniqueCreatedBy: string[]
): FilterOption[] {
  return [
    {
      id: 'name',
      label: 'Company Name',
      type: 'dropdown',
      columnName: 'name',
      available: true,
      options: uniqueCompanyNames
    },
    {
      id: 'type',
      label: 'Company Type',
      type: 'dropdown',
      columnName: 'companySourceType',
      available: true,
      options: uniqueCompanyTypes
    },
    {
      id: 'phone',
      label: 'Phone',
      type: 'text',
      columnName: 'phone',
      available: true
    },
    {
      id: 'website',
      label: 'Website',
      type: 'text',
      columnName: 'website',
      available: true
    },
    {
      id: 'createdBy',
      label: 'Created By',
      type: 'dropdown',
      columnName: 'createdBy',
      available: true,
      options: uniqueCreatedBy
    },
    {
      id: 'company-id',
      label: 'Company ID',
      type: 'text',
      columnName: 'id',
      available: false
    },
    {
      id: 'address',
      label: 'Address',
      type: 'text',
      columnName: 'address',
      available: false
    },
    {
      id: 'territory',
      label: 'Territory',
      type: 'dropdown',
      columnName: 'territory',
      available: false
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'dropdown',
      columnName: 'tags',
      available: false
    },
    {
      id: 'lists',
      label: 'Lists',
      type: 'dropdown',
      columnName: 'lists',
      available: false
    },
    {
      id: 'contact-count',
      label: 'Contact Count',
      type: 'number',
      columnName: 'contactCount',
      available: false
    },
    {
      id: 'job-count',
      label: 'Job Count',
      type: 'number',
      columnName: 'jobCount',
      available: false
    },
    {
      id: 'last-activity',
      label: 'Last Activity',
      type: 'date',
      columnName: 'lastActivity',
      available: false
    },
  ];
}

export function getCompanySortOptions(): SortOption[] {
  return [
    { columnName: 'name', label: 'Company Name' },
    { columnName: 'companySourceType', label: 'Company Type' },
    { columnName: 'phone', label: 'Phone' },
    { columnName: 'website', label: 'Website' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
