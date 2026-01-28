/**
 * Pre-Opportunity Utility Functions
 */

import { STAGE_COLORS, FILTER_COLUMN_MAP, STATUS_CONFIG } from './constants';
import type { PreOpportunity, PreOpportunityStatus, PreOpportunityLandingPage } from './types';
import type { ActiveFilter } from '../advancedFilters/AdvancedFilters';
import type { LandingPageFilter, LandingPageOrderBy } from '../lib/crm-graphql';

/**
 * Map numeric status to string status
 * API returns: 1=QUALIFIED, 2=NEGOTIATION, 3=FOLLOW_UP, 4=WAITING_ON_FACTORY, 5=LOST, 6=WON
 */
const STATUS_NUMBER_MAP: Record<string, PreOpportunityStatus> = {
  '1': 'QUALIFIED',
  '2': 'NEGOTIATION',
  '3': 'FOLLOW_UP',
  '4': 'WAITING_ON_FACTORY',
  '5': 'LOST',
  '6': 'WON',
};

/**
 * Normalize status value - converts numeric status to string enum
 */
export function normalizeStatus(status: string | number | PreOpportunityStatus): PreOpportunityStatus {
  // If it's already a valid string status, return it
  if (typeof status === 'string' && ['QUALIFIED', 'NEGOTIATION', 'FOLLOW_UP', 'WAITING_ON_FACTORY', 'LOST', 'WON'].includes(status)) {
    return status as PreOpportunityStatus;
  }
  
  // Convert to string and try to map from number
  const statusStr = String(status);
  const mapped = STATUS_NUMBER_MAP[statusStr];
  if (mapped) {
    return mapped;
  }
  
  // Default to QUALIFIED if unknown
  return 'QUALIFIED';
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
 * Format currency value - handles NaN and invalid values (up to 4 decimal places)
 */
export function formatCurrency(value: number): string {
  const numValue = Number(value);
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(numValue);
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
 * Only include value OR values, not both - check which one exists
 */
export function convertToLandingPageFilter(filter: ActiveFilter): LandingPageFilter {
  const columnName = FILTER_COLUMN_MAP[filter.columnName] || filter.columnName;
  
  if (filter.values && filter.values.length > 0) {
    return {
      columnName,
      operator: filter.operator,
      values: filter.values,
    };
  }
  return {
    columnName,
    operator: filter.operator,
    value: filter.value,
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

/**
 * Get owner initials from name string
 * Handles names with or without surnames correctly
 */
export function getOwnerInitials(owner: string | undefined | null): string {
  if (!owner) return '?';
  const parts = owner.split(/[\s._-]+/).filter(part => part.trim().length > 0);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    if (first && second) {
      return (first + second).toUpperCase();
    }
  }
  // If only one name or parts are invalid, use first letter(s) of the name
  const trimmed = owner.trim();
  if (trimmed.length >= 2) {
    return trimmed.substring(0, 2).toUpperCase();
  }
  return trimmed.substring(0, 1).toUpperCase() || '?';
}

/**
 * Get a consistent color for an owner based on their ID
 */
export function getOwnerColor(id: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
  ];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

