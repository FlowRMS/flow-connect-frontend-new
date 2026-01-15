/**
 * Job Utility Functions
 */

import { OWNER_COLORS, FILTER_COLUMN_MAP } from './constants';
import type { Job } from './types';
import type { ActiveFilter } from '../advancedFilters/AdvancedFilters';

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

// Status color mapping with background, text, and dot colors
const STATUS_TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'OPEN': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'IN PROGRESS': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'BID': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'BUY': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  'COMPLETE': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

/**
 * Get status badge color with dynamic keyword matching
 * Returns an object with bg, text, and dot color classes
 */
export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  if (!status) {
    return { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
  }
  
  // Check for exact match first (case-insensitive)
  const upperStatus = status.toUpperCase().trim();
  if (STATUS_TAG_COLORS[upperStatus]) {
    return STATUS_TAG_COLORS[upperStatus];
  }
  
  // Check if status contains these keywords
  if (upperStatus === 'OPEN' || upperStatus.includes('OPEN')) {
    return STATUS_TAG_COLORS['OPEN'];
  }
  if (upperStatus.includes('IN PROGRESS') || upperStatus.includes('PROGRESS') || upperStatus.includes('ACTIVE')) {
    return STATUS_TAG_COLORS['IN PROGRESS'];
  }
  if (upperStatus.includes('BID') || upperStatus === 'BIDDING') {
    return STATUS_TAG_COLORS['BID'];
  }
  if (upperStatus.includes('BUY') || upperStatus === 'BUYING') {
    return STATUS_TAG_COLORS['BUY'];
  }
  if (upperStatus.includes('COMPLETE') || upperStatus.includes('WON') || upperStatus.includes('DONE')) {
    return STATUS_TAG_COLORS['COMPLETE'];
  }
  
  // Default color - use indigo for unmatched statuses
  return { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
}

/**
 * Column status colors for Kanban view headers
 * Always uses getStatusColor for dynamic keyword matching
 * This maintains compatibility with other Kanban views
 */
export const COLUMN_STATUS_COLORS: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(target, prop: string) {
      // Always use getStatusColor for dynamic keyword matching
      if (prop in target) {
        return target[prop];
      }
      const color = getStatusColor(prop);
      target[prop] = color.dot;
      return color.dot;
    }
  }
);

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
