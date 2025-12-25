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
  uniqueCompanyNames: string[],
  uniqueEmails: string[]
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
      id: 'contactEmail',
      columnName: 'contactEmail',
      label: 'Email',
      type: 'dropdown',
      options: uniqueEmails,
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
    { columnName: 'contactEmail', label: 'Email' },
    { columnName: 'contactNumber', label: 'Phone' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'isParent', label: 'Is Parent' },
    { columnName: 'published', label: 'Published' },
  ];
}
