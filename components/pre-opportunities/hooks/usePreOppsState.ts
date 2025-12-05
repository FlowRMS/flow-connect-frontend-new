/**
 * Custom Hook for Pre-Opportunities State Management with Client-Side Filtering
 */

import { useState, useMemo, useCallback } from 'react';
import type { ViewMode, PreOpportunityStatus, PreOpportunityLandingPage } from '../types';
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';
import { applyFilter } from '../../lib/filter-utils';
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

  // Filtering and sorting (client-side only)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [clientSortColumns, setClientSortColumns] = useState<ActiveSort[]>([]);

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
    let filtered = rawPreOpps;

    // Apply advanced filters (multi-select)
    if (activeFilters.length > 0) {
      filtered = filtered.filter((preOpp) =>
        activeFilters.every((filter) => applyFilter(preOpp as unknown as Record<string, unknown>, filter))
      );
    } else if (activeFilter) {
      // Backward compatibility for single filter
      filtered = filtered.filter((preOpp) => applyFilter(preOpp as unknown as Record<string, unknown>, activeFilter));
    }

    return filtered;
  }, [rawPreOpps, activeFilter, activeFilters]);

  // Apply client-side sorting if specified
  const preOpps = useMemo(() => {
    let sorted = filteredPreOpps;

    // Apply advanced sorting (multi-sort)
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

    return sorted;
  }, [filteredPreOpps, clientSortColumn, clientSortDirection, clientSortColumns]);

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

  // Handle filter change (single - backward compatibility)
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
    } else {
      setActiveFilters([]);
    }
  }, []);

  // Handle multi-filter change
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
  }, []);

  // Handle sort change (single - backward compatibility)
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    if (sort) {
      setClientSortColumn(sort.columnName);
      setClientSortDirection(sort.direction);
      setClientSortColumns([sort]);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
      setClientSortColumns([]);
    }
  }, []);

  // Handle multi-sort change
  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setClientSortColumns(sorts);
    if (sorts.length > 0) {
      setClientSortColumn(sorts[0].columnName);
      setClientSortDirection(sorts[0].direction);
    } else {
      setClientSortColumn(undefined);
      setClientSortDirection('ASC');
    }
  }, []);

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
