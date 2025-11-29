/**
 * Company Constants and Configurations
 */

// Company types
export const COMPANY_TYPES = ['All', 'Customer', 'Manufacturer'] as const;

// Logo color palette
export const LOGO_COLORS = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-red-600',
  'bg-orange-600',
  'bg-teal-600',
  'bg-green-600'
] as const;

// Sort options for companies
// Note: columnName should match the UI Company type field names
export const COMPANY_SORT_OPTIONS = [
  { columnName: 'name', label: 'Name' },
  { columnName: 'companySourceType', label: 'Type' },
  { columnName: 'phone', label: 'Phone' },
  { columnName: 'website', label: 'Website' },
  { columnName: 'lastActivity', label: 'Last Activity' },
];
