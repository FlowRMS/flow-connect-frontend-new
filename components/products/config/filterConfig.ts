/**
 * Products Filter Configuration
 * Defines filter and sort options for the products page
 */

export interface FilterOption {
  id?: string;
  columnName: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'dropdown';
  operators?: string[];
  options?: { value: string; label: string }[] | string[];
  available?: boolean;
}

export interface SortOption {
  columnName: string;
  label: string;
}

/**
 * Get filter options for products
 */
export function getProductFilterOptions(
  uniqueFactories: string[],
  uniqueCategories: string[],
  uniqueUoms: string[]
): FilterOption[] {
  return [
    {
      id: 'factoryPartNumber',
      columnName: 'factoryPartNumber',
      label: 'Part Number',
      type: 'text',
      operators: ['ILIKE', 'EQ', 'BEGINS_WITH', 'ENDS_WITH'],
    },
    {
      id: 'description',
      columnName: 'description',
      label: 'Description',
      type: 'text',
      operators: ['ILIKE', 'EQ', 'BEGINS_WITH'],
    },
    {
      id: 'factoryTitle',
      columnName: 'factoryTitle',
      label: 'Factory',
      type: 'dropdown',
      operators: ['EQ', 'NE', 'IN'],
      options: uniqueFactories,
    },
    {
      id: 'categoryTitle',
      columnName: 'categoryTitle',
      label: 'Category',
      type: 'dropdown',
      operators: ['EQ', 'NE', 'IN'],
      options: uniqueCategories,
    },
    {
      id: 'uomTitle',
      columnName: 'uomTitle',
      label: 'UOM',
      type: 'dropdown',
      operators: ['EQ', 'NE'],
      options: uniqueUoms,
    },
    {
      id: 'unitPrice',
      columnName: 'unitPrice',
      label: 'Unit Price',
      type: 'number',
      operators: ['EQ', 'GT', 'GTE', 'LT', 'LTE'],
    },
    {
      id: 'defaultCommissionRate',
      columnName: 'defaultCommissionRate',
      label: 'Commission Rate',
      type: 'number',
      operators: ['EQ', 'GT', 'GTE', 'LT', 'LTE'],
    },
    {
      id: 'published',
      columnName: 'published',
      label: 'Published',
      type: 'dropdown',
      operators: ['EQ'],
      options: ['true', 'false'],
    },
    {
      id: 'approvalNeeded',
      columnName: 'approvalNeeded',
      label: 'Approval Needed',
      type: 'dropdown',
      operators: ['EQ'],
      options: ['true', 'false'],
    },
    {
      id: 'createdAt',
      columnName: 'createdAt',
      label: 'Created Date',
      type: 'date',
      operators: ['EQ', 'GT', 'GTE', 'LT', 'LTE'],
    },
  ];
}

/**
 * Get sort options for products
 */
export function getProductSortOptions(): SortOption[] {
  return [
    { columnName: 'factoryPartNumber', label: 'Part Number' },
    { columnName: 'description', label: 'Description' },
    { columnName: 'factoryTitle', label: 'Factory' },
    { columnName: 'categoryTitle', label: 'Category' },
    { columnName: 'unitPrice', label: 'Unit Price' },
    { columnName: 'defaultCommissionRate', label: 'Commission Rate' },
    { columnName: 'published', label: 'Published Status' },
    { columnName: 'approvalNeeded', label: 'Approval Status' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
