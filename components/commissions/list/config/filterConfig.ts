/**
 * Commissions List - Filter Configuration
 * Configuration for the AdvancedFilters component
 */

import type { FilterOption } from '../types';

/**
 * Get filter options for the AdvancedFilters component
 * These are used for the main filter panel (if needed)
 * 
 * Note: Individual column filters are handled directly in the table header
 */
export const getCommissionFilterOptions = (): FilterOption[] => [
  { id: 'check-number', label: 'Check Number', type: 'text' },
  { id: 'sales-rep', label: 'Sales Rep', type: 'dropdown' },
  { id: 'month', label: 'Commission Month', type: 'date' },
  { id: 'status', label: 'Status', type: 'dropdown' },
];

