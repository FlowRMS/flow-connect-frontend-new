/**
 * List management hook
 * Handles takeoffs list loading, filtering, and searching
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Takeoff } from '../../types';
import { transformTakeoffResponse } from '../../types';
import type { ActiveFilter } from '../../../advancedFilters/types';
import { fetchUserTakeoffs } from '../../../lib/graphql/takeoffs';

export function useListManagement() {
  const [takeoffsData, setTakeoffsData] = useState<Takeoff[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load takeoffs from API
  const loadTakeoffs = useCallback(async (options?: {
    search?: string;
    status?: string;
    source?: string;
    title?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams: Record<string, string> = {};
      if (options?.search) searchParams.search = options.search;
      if (options?.status) searchParams.status = options.status;
      if (options?.source) searchParams.source = options.source;
      if (options?.title) searchParams.title = options.title;

      const response = await fetchUserTakeoffs(searchParams);
      const takeoffs = response.map(transformTakeoffResponse);
      setTakeoffsData(takeoffs);
      setTotalCount(takeoffs.length);
    } catch (err) {
      console.error('Failed to fetch takeoffs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch takeoffs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter computations
  const statusFilter = useMemo(() => {
    const f = activeFilters.find(f => f.columnName === 'status');
    return f?.value || '';
  }, [activeFilters]);

  const sourceFilter = useMemo(() => {
    const f = activeFilters.find(f => f.columnName === 'source');
    return f?.value || '';
  }, [activeFilters]);

  const titleFilter = useMemo(() => {
    const f = activeFilters.find(f => f.columnName === 'title');
    return f?.value || '';
  }, [activeFilters]);

  const priorityFilter = useMemo(() => {
    const f = activeFilters.find(f => f.columnName === 'priority');
    return f?.value || '';
  }, [activeFilters]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load on filter changes
  useEffect(() => {
    loadTakeoffs({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      title: titleFilter || undefined,
    });
  }, [debouncedSearch, statusFilter, sourceFilter, titleFilter, loadTakeoffs]);

  // Initial load
  useEffect(() => {
    loadTakeoffs();
  }, [loadTakeoffs]);

  // Apply client-side priority filter
  const takeoffs = useMemo(() => {
    if (!priorityFilter) return takeoffsData;
    return takeoffsData.filter(t => t.priority === priorityFilter);
  }, [takeoffsData, priorityFilter]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    loadTakeoffs({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      title: titleFilter || undefined,
    });
  }, [loadTakeoffs, searchQuery, statusFilter, sourceFilter, titleFilter]);

  return {
    takeoffs,
    takeoffsData,
    setTakeoffsData,
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    totalCount,
    handleRefresh,
    loadTakeoffs,
  };
}
