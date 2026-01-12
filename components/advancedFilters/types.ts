export type FilterOperator = 'EQ' | 'NE' | 'ILIKE' | 'LIKE' | 'BEGINS_WITH' | 'ENDS_WITH' | 'IS_NULL' | 'IS_NOT_NULL' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN';

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

export type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number' | 'boolean';
  columnName?: string; // API column name for filtering
  available?: boolean; // Whether this filter is available in the API
  options?: string[]; // Available options for dropdown filters
};

export type AdvancedFiltersProps = {
  filterOptions: FilterOption[];
  onFilterChange?: (filter: ActiveFilter | undefined) => void;
  onFiltersChange?: (filters: ActiveFilter[]) => void; // Support multiple filters
  activeFilter?: ActiveFilter;
  activeFilters?: ActiveFilter[]; // Support multiple active filters
};

