export type FilterOperator = 'EQ' | 'NE' | 'ILIKE' | 'LIKE' | 'BEGINS_WITH' | 'ENDS_WITH' | 'IS_NULL' | 'IS_NOT_NULL' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN';

export type NumberFormat = 'currency' | 'percentage' | 'number';

export type ActiveFilter = {
  columnName: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
};

export type ActiveSort = {
  columnName: string;
  direction: 'ASC' | 'DESC';
};

export enum ColumnFilterTypeEnum {
  dropdown = 'dropdown',
  date = 'date',
  text = 'text',
  number = 'number',
  boolean = 'boolean',
  month = 'month',
  factory = 'factory',
  category = 'category',
  company = 'company',
  companyType = 'companyType',
  user = 'user',
  customer = 'customer',
}

// For backward compatibility, we also allow plain strings (e.g. 'text', 'date') to be passed
// from older components. Internally we always compare against ColumnFilterTypeEnum.
export type ColumnFilterType = ColumnFilterTypeEnum | string;

export type FilterOption = {
  id: string;
  label: string;
  type: ColumnFilterType;
  columnName?: string; // API column name for filtering
  available?: boolean; // Whether this filter is available in the API
  options?: string[]; // Available options for dropdown filters
  numberFormat?: NumberFormat; // Format for number filters: 'currency' | 'percentage' | 'number' (default)
};

export type AdvancedFiltersProps = {
  filterOptions: FilterOption[];
  onFilterChange?: (filter: ActiveFilter | undefined) => void;
  onFiltersChange?: (filters: ActiveFilter[]) => void; // Support multiple filters
  activeFilter?: ActiveFilter;
  activeFilters?: ActiveFilter[]; // Support multiple active filters
};

