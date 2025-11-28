/**
 * Custom Hook for Pre-Opportunities State Management with API Integration
 */

import { useState, useMemo } from 'react';
import type { ViewMode, PreOpportunityStatus } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { convertToLandingPageFilter, sortPreOpps, getUniqueValues, getPreOppsByStatus } from '../utils';
import { DEFAULT_STAGES } from '../constants';
import { useCRMPreOpportunityLandingPages } from '../../hooks/useCRMApi';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';

export function usePreOppsState() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filtering and sorting
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Convert activeFilter to API filter format
  const apiFilters: LandingPageFilter[] | undefined = useMemo(() => {
    if (!activeFilter) return undefined;
    return [convertToLandingPageFilter(activeFilter)];
  }, [activeFilter]);

  // Build orderBy for API
  const apiOrderBy: LandingPageOrderBy[] | undefined = useMemo(() => {
    if (!clientSortColumn) return undefined;
    return [{ columnName: clientSortColumn, direction: clientSortDirection }];
  }, [clientSortColumn, clientSortDirection]);

  // Fetch pre-opportunities from API
  const {
    data: preOpps = [],
    isLoading,
    error,
    refetch,
  } = useCRMPreOpportunityLandingPages(apiFilters, apiOrderBy);

  // Get stages
  const stages = DEFAULT_STAGES;

  // Calculate unique values for filters
  const uniqueEntityNumbers = useMemo(() => getUniqueValues(preOpps, 'entityNumber'), [preOpps]);
  const uniqueStatuses = useMemo(() => getUniqueValues(preOpps, 'status'), [preOpps]);
  const uniqueCreatedBy = useMemo(() => getUniqueValues(preOpps, 'createdBy'), [preOpps]);

  // Get counts by status
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
    
    // Pre-opp state
    preOpps,
    isLoading,
    error,
    refetch,
    stages,
    statusCounts,
    
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
    
    // Unique values for filters
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
  };
}

