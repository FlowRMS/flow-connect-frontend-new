/**
 * Filter Configuration for Companies
 * Note: columnName should match the backend CompanyLandingPage field names
 */

import type { FilterOption } from '../../advancedFilters/types';

export type SortOption = {
  columnName: string;
  label: string;
};

export function getCompanyFilterOptions(): FilterOption[] {
  return [
    {
      id: 'name',
      label: 'Company Name',
      type: 'text',
      columnName: 'name',
      available: true,
    },
    {
      id: 'type',
      label: 'Company Type',
      type: 'companyType' as const,
      columnName: 'companySourceType',
      available: true,
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
      type: 'text',
      columnName: 'createdBy',
      available: true,
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
      type: 'text',
      columnName: 'territory',
      available: false
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'text',
      columnName: 'tags',
      available: false
    },
    {
      id: 'lists',
      label: 'Lists',
      type: 'text',
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
      columnName: 'createdAt',
      available: false
    },
  ];
}

export function getCompanySortOptions(): SortOption[] {
  return [
    { columnName: 'name', label: 'Company Name' },
    { columnName: 'companySourceType', label: 'Company Type' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
