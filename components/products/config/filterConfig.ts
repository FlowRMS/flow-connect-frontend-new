/**
 * Products Filter Configuration
 * Defines filter and sort options for the products page
 * Note: columnName should match the API ProductLandingPage field names
 */

import type { FilterOption } from '@/components/advancedFilters/types';
import { ColumnFilterTypeEnum } from '@/components/advancedFilters/types';

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
    type: ColumnFilterTypeEnum.text, 
      columnName: 'factoryPartNumber', 
      available: true 
    },
    { 
      id: 'factory', 
      label: 'Factory', 
    type: ColumnFilterTypeEnum.factory, 
      columnName: 'factoryTitle', 
      available: true
      // No options needed - uses dynamic search via FactoryFilter
    },
    { 
      id: 'category', 
      label: 'Category', 
    type: ColumnFilterTypeEnum.category, 
      columnName: 'categoryTitle', 
      available: true
      // No options needed - uses dynamic search via CategoryFilter
    },
    { 
      id: 'uom', 
      label: 'UOM', 
    type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'uomTitle', 
      available: true, 
      options: uniqueUoms 
    },
    { 
      id: 'unit-price', 
      label: 'Unit Price', 
    type: ColumnFilterTypeEnum.number, 
      columnName: 'unitPrice', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'commission-rate', 
      label: 'Commission Rate', 
    type: ColumnFilterTypeEnum.number, 
      columnName: 'defaultCommissionRate', 
      available: true,
      numberFormat: 'percentage' as const
    },
    { 
      id: 'published', 
      label: 'Published', 
    type: ColumnFilterTypeEnum.boolean, 
      columnName: 'published', 
      available: true 
    },
    { 
      id: 'approval-needed', 
      label: 'Approval Needed', 
    type: ColumnFilterTypeEnum.boolean, 
      columnName: 'approvalNeeded', 
      available: true 
    },
    { 
      id: 'created-date', 
      label: 'Created Date', 
    type: ColumnFilterTypeEnum.date, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'tags', 
      label: 'Tags', 
    type: ColumnFilterTypeEnum.text, 
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
