/**
 * Custom Hook for Pre-Opportunities State Management with Server-Side Filtering
 */

import { useState, useMemo, useCallback } from 'react';
import type { ViewMode, PreOpportunityStatus, PreOpportunityLandingPage } from '../types';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/AdvancedFilters';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';
import { sortPreOpps, getUniqueValues } from '../utils';
import { DEFAULT_STAGES } from '../constants';
import { useCRMPreOpportunityLandingPages } from '../../hooks/useCRMApi';

// ============================================================================
// Main Hook
// ============================================================================

export function usePreOppsState() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filtering and sorting - now with server-side support
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);
  
  // Server-side filter and sort state
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  // Convert ActiveFilter to LandingPageFilter for server-side filtering
  const toServerFilters = useCallback((filters: ActiveFilter[]): LandingPageFilter[] => {
    return filters.map(f => {
      // Only include value OR values, not both - check which one exists
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
  }, []);

  // Convert ActiveSort to LandingPageOrderBy for server-side sorting
  const toServerOrderBy = useCallback((sorts: ActiveSort[]): LandingPageOrderBy[] => {
    return sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
  }, []);

  // Fetch pre-opportunities from API with server-side filtering
  const {
    data: rawPreOpps = [],
    isLoading,
    error,
    refetch,
  } = useCRMPreOpportunityLandingPages(serverFilters, serverOrderBy);

  // Get unique values from data for filter options
  const uniqueEntityNumbers = useMemo(() => getUniqueValues(rawPreOpps, 'entityNumber'), [rawPreOpps]);
  const uniqueStatuses = useMemo(() => getUniqueValues(rawPreOpps, 'status'), [rawPreOpps]);
  const uniqueCreatedBy = useMemo(() => getUniqueValues(rawPreOpps, 'createdBy'), [rawPreOpps]);

  // Pre-opps are now server-side filtered, just use raw data directly
  // Apply client-side sorting only if server-side sorting is not applied
  const preOpps = useMemo(() => {
    let sorted = rawPreOpps;

    // Apply client-side sorting only if no server-side sorting
    if (serverOrderBy.length === 0) {
      if (clientSortColumns.length > 0) {
        sorted = [...sorted].sort((a, b) => {
          for (const sort of clientSortColumns) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const aVal = String((a as any)[sort.columnName] || '');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bVal = String((b as any)[sort.columnName] || '');
            const comparison = aVal.localeCompare(bVal);
            if (comparison !== 0) {
              return sort.direction === 'ASC' ? comparison : -comparison;
            }
          }
          return 0;
        });
      } else if (clientSortColumn) {
        sorted = sortPreOpps(sorted, clientSortColumn, clientSortDirection);
      }
    }

    return sorted;
  }, [rawPreOpps, clientSortColumn, clientSortDirection, clientSortColumns, serverOrderBy]);

  // Get stages
  const stages = DEFAULT_STAGES;

  // Get counts by status (from filtered data)
  const statusCounts = useMemo(() => {
    const counts: Record<PreOpportunityStatus, number> = {
      QUALIFIED: 0,
      NEGOTIATION: 0,
      FOLLOW_UP: 0,
      WAITING_ON_FACTORY: 0,
      LOST: 0,
      WON: 0,
    };

    preOpps.forEach((preOpp) => {
      counts[preOpp.status] = (counts[preOpp.status] || 0) + 1;
    });

    return counts;
  }, [preOpps]);

  // Handle filter change (single - backward compatibility) - now with server-side
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
      setServerFilters(toServerFilters([filter]));
    } else {
      setActiveFilters([]);
      setServerFilters([]);
    }
  }, [toServerFilters]);

  // Handle multi-filter change - now with server-side
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    setServerFilters(toServerFilters(filters));
  }, [toServerFilters]);

  // Handle sort change (single - backward compatibility) - now with server-side
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
      setServerOrderBy(toServerOrderBy([sort]));
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
      setServerOrderBy([]);
    }
  }, [toServerOrderBy]);

  // Handle multi-sort change - now with server-side
  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
    if (sorts.length > 0) {
      setClientSortColumn(sorts[0].columnName);
      setClientSortDirection(sorts[0].direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
    setServerOrderBy(toServerOrderBy(sorts));
  }, [toServerOrderBy]);

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
    activeFilters,
    setActiveFilters,
    clientSortColumn,
    setClientSortColumn,
    clientSortDirection,
    setClientSortDirection,
    clientSortColumns,
    setClientSortColumns,

    // Handlers
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleMultiSortChange,

    // Unique values for filters (from ALL data)
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
  };
}
