/**
 * Contact Filter Configuration
 * Note: columnName should match the API ContactLandingPage field names
 */

import type { FilterOption } from '../../advancedFilters/types';
import { CONTACT_ROLES } from '../constants';

/**
 * Get filter options for the AdvancedFilters component
 * Note: columnName should match the API ContactLandingPage field names
 */
export function getContactFilterOptions(): FilterOption[] {
  return [
    { 
      id: 'first-name', 
      label: 'First Name', 
      type: 'text' as const, 
      columnName: 'firstName', 
      available: true 
    },
    { 
      id: 'last-name', 
      label: 'Last Name', 
      type: 'text' as const, 
      columnName: 'lastName', 
      available: true 
    },
    { 
      id: 'company', 
      label: 'Company', 
      type: 'company' as const, 
      columnName: 'companyName', 
      available: true 
    },
    { 
      id: 'role', 
      label: 'Role', 
      type: 'dropdown' as const, 
      columnName: 'role', 
      available: true, 
      options: [...CONTACT_ROLES] 
    },
    { 
      id: 'created-by', 
      label: 'Created By', 
      type: 'text' as const, 
      columnName: 'createdBy', 
      available: true 
    },
    { 
      id: 'created-at', 
      label: 'Created At', 
      type: 'date' as const, 
      columnName: 'createdAt', 
      available: true 
    },
  ];
}

/**
 * Get sort options for the SortButton component
 * Note: columnName should match the API ContactLandingPage field names
 */
export function getContactSortOptions() {
  return [
    { columnName: 'firstName', label: 'First Name' },
    { columnName: 'lastName', label: 'Last Name' },
    { columnName: 'companyName', label: 'Company' },
    { columnName: 'role', label: 'Role' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'createdBy', label: 'Created By' },
  ];
}
