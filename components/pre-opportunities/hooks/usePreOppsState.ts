/**
 * Custom Hook for Pre-Opportunities State Management with Client-Side Filtering
 */

import { useState, useMemo } from 'react';
import type { ViewMode, PreOpportunityStatus, PreOpportunityLandingPage } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { sortPreOpps, getUniqueValues, getPreOppsByStatus } from '../utils';
import { DEFAULT_STAGES } from '../constants';
import { useCRMPreOpportunityLandingPages } from '../../hooks/useCRMApi';

// ============================================================================
// Client-Side Filter Logic
// ============================================================================

/**
 * Apply a single filter to a pre-opportunity
 */
function matchesFilter(preOpp: PreOpportunityLandingPage, filter: ActiveFilter): boolean {
  const columnName = filter.columnName;
  
  // Map filter column names to actual object properties
  const propertyMap: Record<string, keyof PreOpportunityLandingPage> = {
    'entity-number': 'entityNumber',
    'entityNumber': 'entityNumber',
    'status': 'status',
    'created-by': 'createdBy',
    'createdBy': 'createdBy',
    'total': 'total',
    'entityDate': 'entityDate',
    'expDate': 'expDate',
    'createdAt': 'createdAt',
  };
  
  const propertyKey = propertyMap[columnName] || columnName as keyof PreOpportunityLandingPage;
  const fieldValue = preOpp[propertyKey];
  const stringValue = String(fieldValue || '').toLowerCase();
  
  // Handle IN operator (multi-select)
  if (filter.operator === 'IN' && filter.values && filter.values.length > 0) {
    return filter.values.some(v => 
      String(v).toLowerCase() === stringValue
    );
  }
  
  // Handle single value filters
  const filterValue = String(filter.value || '').toLowerCase();
  
  switch (filter.operator) {
    case 'EQ':
      return stringValue === filterValue;
    case 'NE':
      return stringValue !== filterValue;
    case 'ILIKE':
    case 'LIKE':
      return stringValue.includes(filterValue);
    case 'BEGINS_WITH':
      return stringValue.startsWith(filterValue);
    case 'ENDS_WITH':
      return stringValue.endsWith(filterValue);
    case 'IS_NULL':
      return !fieldValue || stringValue === '';
    case 'IS_NOT_NULL':
      return !!fieldValue && stringValue !== '';
    case 'GT':
      return Number(fieldValue) > Number(filter.value);
    case 'GTE':
      return Number(fieldValue) >= Number(filter.value);
    case 'LT':
      return Number(fieldValue) < Number(filter.value);
    case 'LTE':
      return Number(fieldValue) <= Number(filter.value);
    default:
      return true;
  }
}

/**
 * Apply all filters to pre-opportunities array (client-side)
 */
function applyClientSideFilter(
  preOpps: PreOpportunityLandingPage[],
  filter: ActiveFilter | undefined
): PreOpportunityLandingPage[] {
  if (!filter) return preOpps;
  
  return preOpps.filter(preOpp => matchesFilter(preOpp, filter));
}

// ============================================================================
// Main Hook
// ============================================================================

export function usePreOppsState() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filtering and sorting (client-side only)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Fetch ALL pre-opportunities from API (no server-side filtering)
  const {
    data: rawPreOpps = [],
    isLoading,
    error,
    refetch,
  } = useCRMPreOpportunityLandingPages(undefined, undefined);

  // Get unique values from ALL data (before filtering) for filter options
  const uniqueEntityNumbers = useMemo(() => getUniqueValues(rawPreOpps, 'entityNumber'), [rawPreOpps]);
  const uniqueStatuses = useMemo(() => getUniqueValues(rawPreOpps, 'status'), [rawPreOpps]);
  const uniqueCreatedBy = useMemo(() => getUniqueValues(rawPreOpps, 'createdBy'), [rawPreOpps]);

  // Apply client-side filtering
  const filteredPreOpps = useMemo(() => {
    return applyClientSideFilter(rawPreOpps, activeFilter);
  }, [rawPreOpps, activeFilter]);

  // Apply client-side sorting if specified
  const preOpps = useMemo(() => {
    if (!clientSortColumn) return filteredPreOpps;
    return sortPreOpps(filteredPreOpps, clientSortColumn, clientSortDirection);
  }, [filteredPreOpps, clientSortColumn, clientSortDirection]);

  // Get stages
  const stages = DEFAULT_STAGES;

  // Get counts by status (from filtered data)
  const statusCounts = useMemo(() => {
    const counts: Record<PreOpportunityStatus, number> = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CONVERTED: 0,
    };
    
    preOpps.forEach((preOpp) => {
      counts[preOpp.status] = (counts[preOpp.status] || 0) + 1;
    });
    
    return counts;
  }, [preOpps]);

  return {
    // View state
    viewMode,
    setViewMode,
    
    // Pre-opp state (filtered)
    preOpps,
    isLoading,
    error,
    refetch,
    stages,
    statusCounts,
    
    // Raw data count for UI
    totalCount: rawPreOpps.length,
    filteredCount: preOpps.length,
    
    // Drag and drop
    activeId,
    setActiveId,
    
    // Filtering and sorting
    activeFilter,
    setActiveFilter,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,
    
    // Unique values for filters (from ALL data)
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
  };
}
