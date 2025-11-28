/**
 * Custom Hook for Pre-Opportunities State Management
 */

import { useState, useMemo } from 'react';
import type { PreOpp, ViewMode } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { applyFilter, sortPreOpps, getUniqueValues } from '../utils';
import { DEFAULT_STAGES } from '../constants';
import { INITIAL_PRE_OPPS } from '../mockData';

export function usePreOppsState() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);

  // Pre-opportunities data
  const [preOpps, setPreOpps] = useState<PreOpp[]>(INITIAL_PRE_OPPS);

  // Filtering and sorting
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [clientSortColumn, setClientSortColumn] = useState<string | undefined>(undefined);
  const [clientSortDirection, setClientSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Process pre-opps with filtering and sorting
  const processedPreOpps: PreOpp[] = useMemo(() => {
    let filtered = [...preOpps];

    // Apply client-side filter
    if (activeFilter) {
      filtered = filtered.filter((preOpp) => applyFilter(preOpp, activeFilter));
    }

    // Apply client-side sorting
    if (clientSortColumn) {
      filtered = sortPreOpps(filtered, clientSortColumn, clientSortDirection);
    }

    return filtered;
  }, [preOpps, activeFilter, clientSortColumn, clientSortDirection]);

  // Get stages
  const stages = DEFAULT_STAGES;

  // Calculate unique values for filters
  const uniquePreOppNames = useMemo(() => getUniqueValues(preOpps, 'name'), [preOpps]);
  const uniqueStages = useMemo(() => getUniqueValues(preOpps, 'stage'), [preOpps]);
  const uniqueJobs = useMemo(() => getUniqueValues(preOpps, 'job'), [preOpps]);
  const uniqueSoldTo = useMemo(() => getUniqueValues(preOpps, 'soldTo'), [preOpps]);
  const uniqueManufacturers = useMemo(() => getUniqueValues(preOpps, 'manufacturer'), [preOpps]);
  const uniqueOwners = useMemo(() => getUniqueValues(preOpps, 'owner'), [preOpps]);
  const uniqueTags = useMemo(() => {
    const allTags = preOpps.flatMap(p => p.tags);
    return Array.from(new Set(allTags)).sort();
  }, [preOpps]);

  return {
    // View state
    viewMode,
    setViewMode,
    
    // Pre-opp state
    preOpps: processedPreOpps,
    setPreOpps,
    stages,
    
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
    uniquePreOppNames,
    uniqueStages,
    uniqueJobs,
    uniqueSoldTo,
    uniqueManufacturers,
    uniqueOwners,
    uniqueTags,
  };
}
