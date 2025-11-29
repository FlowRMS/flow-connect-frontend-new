/**
 * Job Utility Functions
 */

import { OWNER_COLORS, STATUS_COLORS, FILTER_COLUMN_MAP } from './constants';
import type { Job } from './types';
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
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-500 text-white';
}

/**
 * Apply filter to a job
 */
export function applyFilter(job: Job, filter: ActiveFilter): boolean {
  const actualColumn = FILTER_COLUMN_MAP[filter.columnName] || filter.columnName;
  const value = String((job as any)[actualColumn] || '').toLowerCase();
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
 * Sort jobs by a column
 */
export function sortJobs(
  jobs: Job[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC'
): Job[] {
  const actualColumn = FILTER_COLUMN_MAP[sortColumn] || sortColumn;
  return [...jobs].sort((a, b) => {
    const aVal = String((a as any)[actualColumn] || '');
    const bVal = String((b as any)[actualColumn] || '');
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Get unique values from jobs for a specific field
 */
export function getUniqueValues(jobs: Job[], field: keyof Job): string[] {
  return Array.from(new Set(jobs.map(j => j[field] as string)))
    .filter(Boolean)
    .sort();
}
