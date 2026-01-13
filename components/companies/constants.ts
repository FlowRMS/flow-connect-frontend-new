/**
 * Company Constants and Configurations
 */

import { COMPANY_SOURCE_TYPE_LABELS, COMPANY_SOURCE_TYPE_OPTIONS } from '../lib/crm-graphql';

// Company type filter options for the Companies page
// 'All' shows all companies, plus individual type labels from the GraphQL types
export const COMPANY_TYPES = [
  'All',
  ...COMPANY_SOURCE_TYPE_OPTIONS.map(type => COMPANY_SOURCE_TYPE_LABELS[type])
] as const;

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
