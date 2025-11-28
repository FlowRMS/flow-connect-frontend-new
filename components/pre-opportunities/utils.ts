/**
 * Pre-Opportunity Utility Functions
 */

import { OWNER_COLORS, STAGE_COLORS, FILTER_COLUMN_MAP } from './constants';
import type { PreOpp } from './types';
import type { ActiveFilter } from '../AdvancedFilters';

/**
 * Get initials from a name
 */
export function getOwnerInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Get color for owner badge based on ID
 */
export function getOwnerColor(id: string): string {
  const colorIndex = id.charCodeAt(id.length - 1) % OWNER_COLORS.length;
  return OWNER_COLORS[colorIndex];
}

/**
 * Get stage badge color
 */
export function getStageColor(stage: string): string {
  return STAGE_COLORS[stage] || 'bg-gray-500 text-white';
}

/**
 * Apply filter to a pre-opp
 */
export function applyFilter(preOpp: PreOpp, filter: ActiveFilter): boolean {
  const actualColumn = FILTER_COLUMN_MAP[filter.columnName] || filter.columnName;
  const value = String((preOpp as any)[actualColumn] || '').toLowerCase();
  const filterValue = String(filter.value || '').toLowerCase();

  if (filter.operator === 'IN' && filter.values) {
    return filter.values.some(v => String(v).toLowerCase() === value);
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
    default:
      return true;
  }
}

/**
 * Sort pre-opps by a column
 */
export function sortPreOpps(
  preOpps: PreOpp[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC'
): PreOpp[] {
  return [...preOpps].sort((a, b) => {
    const aVal = String((a as any)[sortColumn] || '');
    const bVal = String((b as any)[sortColumn] || '');
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Get unique values from pre-opps for a specific field
 */
export function getUniqueValues(preOpps: PreOpp[], field: keyof PreOpp): string[] {
  return Array.from(new Set(preOpps.map(p => p[field] as string)))
    .filter(Boolean)
    .sort();
}

/**
 * Get pre-opps by stage
 */
export function getPreOppsByStage(preOpps: PreOpp[], stage: string): PreOpp[] {
  return preOpps.filter(preOpp => preOpp.stage === stage);
}
