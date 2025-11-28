/**
 * Pre-Opportunity Utility Functions
 */

import { STAGE_COLORS, FILTER_COLUMN_MAP, STATUS_CONFIG } from './constants';
import type { PreOpportunity, PreOpportunityStatus, PreOpportunityLandingPage } from './types';
import type { ActiveFilter } from '../AdvancedFilters';
import type { LandingPageFilter, LandingPageOrderBy } from '../lib/crm-graphql';

/**
 * Map numeric status to string status
 * API returns: 1=DRAFT, 2=PENDING, 3=APPROVED, 4=REJECTED, 5=CONVERTED
 */
const STATUS_NUMBER_MAP: Record<string, PreOpportunityStatus> = {
  '1': 'DRAFT',
  '2': 'PENDING',
  '3': 'APPROVED',
  '4': 'REJECTED',
  '5': 'CONVERTED',
};

/**
 * Normalize status value - converts numeric status to string enum
 */
export function normalizeStatus(status: string | number | PreOpportunityStatus): PreOpportunityStatus {
  // If it's already a valid string status, return it
  if (typeof status === 'string' && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CONVERTED'].includes(status)) {
    return status as PreOpportunityStatus;
  }
  
  // Convert to string and try to map from number
  const statusStr = String(status);
  const mapped = STATUS_NUMBER_MAP[statusStr];
  if (mapped) {
    return mapped;
  }
  
  // Default to DRAFT if unknown
  return 'DRAFT';
}

/**
 * Normalize a pre-opportunity object's status field
 */
export function normalizePreOpportunityStatus<T extends { status: any }>(preOpp: T): T {
  return {
    ...preOpp,
    status: normalizeStatus(preOpp.status),
  };
}

/**
 * Normalize an array of pre-opportunity objects
 */
export function normalizePreOpportunitiesStatus<T extends { status: any }>(preOpps: T[]): T[] {
  return preOpps.map(normalizePreOpportunityStatus);
}

/**
 * Get status display label
 */
export function getStatusLabel(status: PreOpportunityStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

/**
 * Get stage badge color
 */
export function getStageColor(status: PreOpportunityStatus): string {
  return STAGE_COLORS[status] || 'bg-gray-500 text-white';
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert ActiveFilter to LandingPageFilter
 */
export function convertToLandingPageFilter(filter: ActiveFilter): LandingPageFilter {
  const columnName = FILTER_COLUMN_MAP[filter.columnName] || filter.columnName;
  
  return {
    columnName,
    operator: filter.operator,
    value: filter.value,
    values: filter.values,
  };
}

/**
 * Apply client-side filter to a pre-opp (for additional filtering)
 */
export function applyFilter(preOpp: PreOpportunityLandingPage, filter: ActiveFilter): boolean {
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
  preOpps: PreOpportunityLandingPage[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC'
): PreOpportunityLandingPage[] {
  return [...preOpps].sort((a, b) => {
    const aVal = (a as any)[sortColumn];
    const bVal = (b as any)[sortColumn];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'ASC' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    const comparison = aStr.localeCompare(bStr);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Get unique values from pre-opps for a specific field
 */
export function getUniqueValues(
  preOpps: PreOpportunityLandingPage[],
  field: keyof PreOpportunityLandingPage
): string[] {
  return Array.from(new Set(preOpps.map(p => String(p[field] || ''))))
    .filter(Boolean)
    .sort();
}

/**
 * Get pre-opps by status
 */
export function getPreOppsByStatus(
  preOpps: PreOpportunityLandingPage[],
  status: PreOpportunityStatus
): PreOpportunityLandingPage[] {
  return preOpps.filter(preOpp => preOpp.status === status);
}

/**
 * Calculate total value for pre-opps
 */
export function calculateTotalValue(preOpps: PreOpportunityLandingPage[]): number {
  return preOpps.reduce((sum, preOpp) => sum + (preOpp.total || 0), 0);
}

