/**
 * Products Filter Configuration
 * Defines filter and sort options for the products page
 * Note: columnName should match the API ProductLandingPage field names
 */

import type { FilterOption } from '@/components/advancedFilters/types';

export interface SortOption {
  columnName: string;
  label: string;
}

/**
 * Get filter options for products
 * Note: columnName should match the API ProductLandingPage field names
 */
export function getProductFilterOptions(
  uniqueFactories: string[] = [],
  uniqueCategories: string[] = [],
  uniqueUoms: string[] = []
): FilterOption[] {
  return [
    { 
      id: 'part-number', 
      label: 'Part Number', 
      type: 'text' as const, 
      columnName: 'factoryPartNumber', 
      available: true 
    },
    { 
      id: 'factory', 
      label: 'Factory', 
      type: 'factory' as const, 
      columnName: 'factoryTitle', 
      available: true
      // No options needed - uses dynamic search via FactoryFilter
    },
    { 
      id: 'category', 
      label: 'Category', 
      type: 'category' as const, 
      columnName: 'categoryTitle', 
      available: true
      // No options needed - uses dynamic search via CategoryFilter
    },
    { 
      id: 'uom', 
      label: 'UOM', 
      type: 'dropdown' as const, 
      columnName: 'uomTitle', 
      available: true, 
      options: uniqueUoms 
    },
    { 
      id: 'unit-price', 
      label: 'Unit Price', 
      type: 'number' as const, 
      columnName: 'unitPrice', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'commission-rate', 
      label: 'Commission Rate', 
      type: 'number' as const, 
      columnName: 'defaultCommissionRate', 
      available: true,
      numberFormat: 'percentage' as const
    },
    { 
      id: 'published', 
      label: 'Published', 
      type: 'boolean' as const, 
      columnName: 'published', 
      available: true 
    },
    { 
      id: 'approval-needed', 
      label: 'Approval Needed', 
      type: 'boolean' as const, 
      columnName: 'approvalNeeded', 
      available: true 
    },
    { 
      id: 'created-date', 
      label: 'Created Date', 
      type: 'date' as const, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'tags', 
      label: 'Tags', 
      type: 'text' as const, 
      columnName: 'tags', 
      available: true 
    },
  ];
}

/**
 * Get sort options for products
 */
export function getProductSortOptions(): SortOption[] {
  return [
    { columnName: 'factoryPartNumber', label: 'Part Number' },
    { columnName: 'factoryTitle', label: 'Factory' },
    { columnName: 'categoryTitle', label: 'Category' },
    { columnName: 'unitPrice', label: 'Unit Price' },
    { columnName: 'defaultCommissionRate', label: 'Commission Rate' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
