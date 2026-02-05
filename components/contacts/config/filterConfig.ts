/**
 * Contact Filter Configuration
 * Note: columnName should match the API ContactLandingPage field names
 */

import type { FilterOption } from '../../advancedFilters/types';
import { ColumnFilterTypeEnum } from '../../advancedFilters/types';

/**
 * Get filter options for the AdvancedFilters component
 * Note: columnName should match the API ContactLandingPage field names
 */
export function getContactFilterOptions(): FilterOption[] {
  return [
    { 
      id: 'first-name', 
      label: 'First Name', 
      type: ColumnFilterTypeEnum.text, 
      columnName: 'firstName', 
      available: true 
    },
    { 
      id: 'last-name', 
      label: 'Last Name', 
      type: ColumnFilterTypeEnum.text, 
      columnName: 'lastName', 
      available: true 
    },
    { 
      id: 'company', 
      label: 'Company', 
      type: ColumnFilterTypeEnum.company, 
      columnName: 'companyName', 
      available: true 
    },
    {
      id: 'role',
      label: 'Role',
      type: ColumnFilterTypeEnum.picklist,
      columnName: 'role',
      available: true,
      picklistKey: 'contactRoles',
      multiSelect: true,
    },
    { 
      id: 'created-by', 
      label: 'Created By', 
      type: ColumnFilterTypeEnum.text, 
      columnName: 'createdBy', 
      available: true 
    },
    { 
      id: 'created-at', 
      label: 'Entry Date', 
      type: ColumnFilterTypeEnum.date, 
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
    { columnName: 'createdAt', label: 'Entry Date' },
    { columnName: 'createdBy', label: 'Created By' },
  ];
}
