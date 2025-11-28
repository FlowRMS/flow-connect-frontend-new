/**
 * Company Utility Functions
 */

import { LOGO_COLORS } from './constants';
import type { Company } from './types';
import type { ActiveFilter } from '../AdvancedFilters';

/**
 * Get initials from company name
 */
export function getCompanyInitials(name: string): string {
  const words = name.split(' ');
  if (words.length === 1) return name.substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Get logo color based on company ID
 */
export function getLogoColor(id: string): string {
  const index = id.charCodeAt(id.length - 1) % LOGO_COLORS.length;
  return LOGO_COLORS[index];
}

/**
 * Format date to relative time
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Apply filter to a company
 */
export function applyFilter(company: Company, filter: ActiveFilter): boolean {
  const value = String((company as unknown as Record<string, unknown>)[filter.columnName] || '').toLowerCase();
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
 * Sort companies by a column
 */
export function sortCompanies(
  companies: Company[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC'
): Company[] {
  return [...companies].sort((a, b) => {
    const aVal = String((a as unknown as Record<string, unknown>)[sortColumn] || '');
    const bVal = String((b as unknown as Record<string, unknown>)[sortColumn] || '');
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Get unique values from companies for a specific field
 */
export function getUniqueValues(companies: Company[], field: keyof Company): string[] {
  const values = new Set<string>();
  companies.forEach(company => {
    const value = company[field];
    if (Array.isArray(value)) {
      value.forEach(v => values.add(v));
    } else if (value) {
      values.add(String(value));
    }
  });
  return Array.from(values).filter(Boolean).sort();
}
