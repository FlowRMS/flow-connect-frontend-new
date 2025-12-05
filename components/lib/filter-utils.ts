/**
 * Shared Filter and Sort Utilities
 * Reusable functions for filtering and sorting across all CRM pages
 */

import type { ActiveFilter } from '../AdvancedFilters';

/**
 * Apply a filter to a single entity
 * Works with any object type - uses generic typing
 */
export function applyFilter<T extends Record<string, unknown>>(
  entity: T,
  filter: ActiveFilter,
  columnMap?: Record<string, string>
): boolean {
  const actualColumn = columnMap?.[filter.columnName] || filter.columnName;
  const rawValue = entity[actualColumn];

  // Handle array values (like tags)
  const value = Array.isArray(rawValue)
    ? rawValue.map(v => String(v).toLowerCase()).join(',')
    : String(rawValue || '').toLowerCase();

  const filterValue = String(filter.value || '').toLowerCase();

  if (filter.operator === 'IN' && filter.values) {
    const filterValues = filter.values.map(v => String(v).toLowerCase());
    if (Array.isArray(rawValue)) {
      return rawValue.some(v => filterValues.includes(String(v).toLowerCase()));
    }
    return filterValues.includes(value);
  }

  switch (filter.operator) {
    case 'EQ':
      return value === filterValue;
    case 'NE':
      return value !== filterValue;
    case 'ILIKE':
    case 'LIKE':
      return value.includes(filterValue);
    case 'BEGINS_WITH':
      return value.startsWith(filterValue);
    case 'ENDS_WITH':
      return value.endsWith(filterValue);
    case 'IS_NULL':
      return !value || value === '';
    case 'IS_NOT_NULL':
      return !!(value && value !== '');
    case 'GT':
      return parseFloat(value) > parseFloat(filterValue);
    case 'GTE':
      return parseFloat(value) >= parseFloat(filterValue);
    case 'LT':
      return parseFloat(value) < parseFloat(filterValue);
    case 'LTE':
      return parseFloat(value) <= parseFloat(filterValue);
    default:
      return true;
  }
}

/**
 * Apply multiple filters to a list of entities
 */
export function applyFilters<T extends Record<string, unknown>>(
  entities: T[],
  filters: ActiveFilter[],
  columnMap?: Record<string, string>
): T[] {
  if (filters.length === 0) return entities;

  return entities.filter((entity) =>
    filters.every((filter) => applyFilter(entity, filter, columnMap))
  );
}

/**
 * Sort entities by a single column
 */
export function sortEntities<T extends Record<string, unknown>>(
  entities: T[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC',
  columnMap?: Record<string, string>
): T[] {
  const actualColumn = columnMap?.[sortColumn] || sortColumn;
  return [...entities].sort((a, b) => {
    const aVal = String(a[actualColumn] || '');
    const bVal = String(b[actualColumn] || '');

    // Try numeric comparison first
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirection === 'ASC' ? aNum - bNum : bNum - aNum;
    }

    // Fall back to string comparison
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Apply multiple sorts to a list of entities
 */
export function sortEntitiesMulti<T extends Record<string, unknown>>(
  entities: T[],
  sorts: { columnName: string; direction: 'ASC' | 'DESC' }[],
  columnMap?: Record<string, string>
): T[] {
  if (sorts.length === 0) return entities;

  return [...entities].sort((a, b) => {
    for (const sort of sorts) {
      const actualColumn = columnMap?.[sort.columnName] || sort.columnName;
      const aVal = String(a[actualColumn] || '');
      const bVal = String(b[actualColumn] || '');

      // Try numeric comparison first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      let comparison: number;

      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = aVal.localeCompare(bVal);
      }

      if (comparison !== 0) {
        return sort.direction === 'ASC' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * Get unique values from an array of entities for a specific field
 */
export function getUniqueValues<T extends Record<string, unknown>>(
  entities: T[],
  field: keyof T
): string[] {
  const values = entities.map((e) => e[field]);
  const flatValues = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
  return Array.from(new Set(flatValues.map((v) => String(v || ''))))
    .filter(Boolean)
    .sort();
}

/**
 * Type for filter option configuration
 */
export interface FilterOption {
  id: string;
  label: string;
  type: 'dropdown' | 'text' | 'date' | 'number';
  columnName?: string;
  available: boolean;
  options?: string[];
}

/**
 * Type for sort option configuration
 */
export interface SortOption {
  columnName: string;
  label: string;
}
