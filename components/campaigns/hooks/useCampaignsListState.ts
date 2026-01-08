/**
 * Campaigns List State Management Hook
 * Manages filtering and sorting for campaigns list view
 * Follows the same pattern as useNotesState and useTasksState
 */

import { useState, useMemo, useCallback } from 'react';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/AdvancedFilters';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';
import { useCampaignsInfinite } from '../api';
import type { CampaignLandingPage } from '../api';
import { mapCampaignStatus } from '../types';

/**
 * Parse API campaign to UI format
 */
function parseApiCampaign(campaign: CampaignLandingPage) {
  return {
    id: campaign.id,
    name: campaign.name,
    subject: '', // Subject is not returned in landing page query
    recipients: campaign.recipientsCount,
    status: mapCampaignStatus(campaign.status),
    sentCount: campaign.sentCount || 0,
    createdDate: campaign.createdAt,
    recipientListType: campaign.recipientListType,
    progress: campaign.progress,
  };
}

export function useCampaignsListState(pollInterval?: number) {
  // Advanced filtering and sorting state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeSorts, setActiveSorts] = useState<ActiveSort[]>([]);
  const [activeSort, setActiveSort] = useState<ActiveSort | undefined>(undefined);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  // CRM API hooks with infinite scroll - now with server-side filters and polling
  const {
    data: campaignsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCampaignsInfinite(serverFilters, serverOrderBy, undefined, pollInterval);

  // Flatten paginated results with deduplication
  const rawCampaigns = useMemo(() => {
    if (!campaignsData?.pages) return [];
    const allRecords = campaignsData.pages.flatMap(page => page.records);
    // Deduplicate by ID
    const seen = new Set<string>();
    return allRecords.filter((record: CampaignLandingPage) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [campaignsData]);

  // Parse campaigns from API format to UI format
  const campaigns = useMemo(() => {
    return rawCampaigns.map(parseApiCampaign);
  }, [rawCampaigns]);

  // Calculate unique values for filter options
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(rawCampaigns.map(c => c.status))).sort();
  }, [rawCampaigns]);

  const uniqueNames = useMemo(() => {
    return Array.from(new Set(rawCampaigns.map(c => c.name))).sort();
  }, [rawCampaigns]);

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

  // Filter change handlers
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
      setServerFilters(toServerFilters([filter])); // Server-side filter
    } else {
      setActiveFilters([]);
      setServerFilters([]); // Clear server-side filters
    }
  }, [toServerFilters]);

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    setServerFilters(toServerFilters(filters)); // Server-side filters
  }, [toServerFilters]);

  // Sort change handlers
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    setActiveSort(sort);
    if (sort) {
      setActiveSorts([sort]);
      setServerOrderBy(toServerOrderBy([sort])); // Server-side sort
    } else {
      setActiveSorts([]);
      setServerOrderBy([]); // Clear server-side sort
    }
  }, [toServerOrderBy]);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setActiveSorts(sorts);
    setActiveSort(sorts.length > 0 ? sorts[0] : undefined);
    setServerOrderBy(toServerOrderBy(sorts)); // Server-side sort
  }, [toServerOrderBy]);

  return {
    // Campaigns data
    campaigns,
    isLoading,
    error,
    refetch,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // Unique values for filters
    uniqueStatuses,
    uniqueNames,

    // Advanced filtering
    activeFilters,
    setActiveFilters,
    activeFilter,
    setActiveFilter,
    handleFilterChange,
    handleFiltersChange,

    // Sorting
    activeSorts,
    setActiveSorts,
    activeSort,
    setActiveSort,
    handleSortChange,
    handleMultiSortChange,
  };
}

