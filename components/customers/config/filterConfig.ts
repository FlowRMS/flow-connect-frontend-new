/**
 * Customer Filter and Sort Configuration
 */

export interface FilterOption {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
  columnName?: string;
  available?: boolean;
  options?: string[];
}

export interface SortOption {
  columnName: string;
  label: string;
}

export function getCustomerFilterOptions(
  uniqueCompanyNames: string[]
): FilterOption[] {
  return [
    {
      id: 'companyName',
      columnName: 'companyName',
      label: 'Company Name',
      type: 'dropdown',
      options: uniqueCompanyNames,
    },
    {
      id: 'isParent',
      columnName: 'isParent',
      label: 'Is Parent',
      type: 'dropdown',
      options: ['true', 'false'],
    },
    {
      id: 'published',
      columnName: 'published',
      label: 'Published',
      type: 'dropdown',
      options: ['true', 'false'],
    },
  ];
}

export function getCustomerSortOptions(): SortOption[] {
  return [
    { columnName: 'companyName', label: 'Company Name' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'isParent', label: 'Is Parent' },
    { columnName: 'published', label: 'Published' },
  ];
}
