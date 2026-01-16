/**
 * Product Crosses Constants
 */

export interface ProductCrossFilterOption {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'date';
  columnName: string;
  options?: string[];
}

// Filter options for product crosses
export const PRODUCT_CROSS_FILTER_OPTIONS: ProductCrossFilterOption[] = [
  { id: 'competitorManufacturer', label: 'Competitor Manufacturer', type: 'text', columnName: 'competitorManufacturer' },
  { id: 'ourManufacturer', label: 'Our Manufacturer', type: 'text', columnName: 'ourManufacturer' },
  {
    id: 'timesUsed',
    label: 'Times Used',
    type: 'dropdown',
    columnName: 'usageLevel',
    options: ['High (30+)', 'Medium (10-29)', 'Low (5-9)', 'Very Low (<5)'],
  },
  { id: 'dateAdded', label: 'Date Added', type: 'date', columnName: 'createdAt' },
  { id: 'lastUsed', label: 'Last Used', type: 'date', columnName: 'lastUsed' },
];

// Sort options for product crosses
export const PRODUCT_CROSS_SORT_OPTIONS = [
  { columnName: 'competitorManufacturer', label: 'Competitor Manufacturer' },
  { columnName: 'ourManufacturer', label: 'Our Manufacturer' },
  { columnName: 'timesUsed', label: 'Times Used' },
  { columnName: 'lastUsed', label: 'Last Used' },
] as const;
