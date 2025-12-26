/**
 * Simple Quotes State Hook
 * Manages state for the Simple Quotes landing page
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useQuotesInfinite,
  type QuoteLandingPage,
  type QuoteLandingPageFilter,
  type QuoteLandingPageOrderBy,
  type QuoteStatus,
  type QuotePipelineStage,
} from '../api';

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Column sort state
interface SortState {
  column: string;
  direction: SortDirection;
}

// Column filters
interface ColumnFilters {
  quoteNumber: string;
  status: string;
  pipelineStage: string;
  entityDate: string;
  expDate: string;
}

// Quote stats
interface QuoteStats {
  totalQuotes: number;
  openQuotes: number;
  orderedQuotes: number;
  lostQuotes: number;
  expiredQuotes: number;
}

export function useSimpleQuotesState() {
  // Mount state
  const [isMounted, setIsMounted] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // Column filters
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    quoteNumber: '',
    status: '',
    pipelineStage: '',
    entityDate: '',
    expDate: '',
  });

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Build API filters and orderBy from state
  const apiFilters = useMemo<QuoteLandingPageFilter[]>(() => {
    const filters: QuoteLandingPageFilter[] = [];

    if (searchQuery) {
      filters.push({
        columnName: 'quoteNumber',
        operator: 'CONTAINS',
        value: searchQuery,
      });
    }

    if (columnFilters.status) {
      filters.push({
        columnName: 'status',
        operator: 'EQ',
        value: columnFilters.status,
      });
    }

    if (columnFilters.pipelineStage) {
      filters.push({
        columnName: 'pipelineStage',
        operator: 'EQ',
        value: columnFilters.pipelineStage,
      });
    }

    return filters;
  }, [searchQuery, columnFilters]);

  const apiOrderBy = useMemo<QuoteLandingPageOrderBy[]>(() => {
    if (!sortState || !sortState.direction) {
      return [{ columnName: 'createdAt', direction: 'DESC' }];
    }
    return [
      {
        columnName: sortState.column,
        direction: sortState.direction === 'asc' ? 'ASC' : 'DESC',
      },
    ];
  }, [sortState]);

  // Fetch quotes with infinite scroll
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuotesInfinite(apiFilters, apiOrderBy);

  // Flatten paginated data
  const allQuotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.records);
  }, [data]);

  // Total count
  const totalCount = useMemo(() => {
    if (!data?.pages?.[0]) return 0;
    return data.pages[0].total;
  }, [data]);

  // Client-side filtering (for quick filters that don't need API)
  const filteredQuotes = useMemo(() => {
    let result = [...allQuotes];

    // Filter by quote number (client-side for instant feedback)
    if (columnFilters.quoteNumber) {
      result = result.filter((q) =>
        q.quoteNumber.toLowerCase().includes(columnFilters.quoteNumber.toLowerCase())
      );
    }

    // Sort on client side if needed
    if (sortState?.direction) {
      result.sort((a, b) => {
        let aVal: string | number | undefined;
        let bVal: string | number | undefined;

        switch (sortState.column) {
          case 'quoteNumber':
            aVal = a.quoteNumber;
            bVal = b.quoteNumber;
            break;
          case 'status':
            aVal = a.status || '';
            bVal = b.status || '';
            break;
          case 'pipelineStage':
            aVal = a.pipelineStage || '';
            bVal = b.pipelineStage || '';
            break;
          case 'total':
            aVal = a.total || 0;
            bVal = b.total || 0;
            break;
          case 'entityDate':
            aVal = a.entityDate || '';
            bVal = b.entityDate || '';
            break;
          case 'expDate':
            aVal = a.expDate || '';
            bVal = b.expDate || '';
            break;
          case 'createdAt':
            aVal = a.createdAt || '';
            bVal = b.createdAt || '';
            break;
          default:
            return 0;
        }

        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allQuotes, columnFilters.quoteNumber, sortState]);

  // Calculate stats
  const stats = useMemo<QuoteStats>(() => {
    const total = allQuotes.length;
    const open = allQuotes.filter((q) => q.status === 'OPEN').length;
    const ordered = allQuotes.filter((q) => q.status === 'ORDERED').length;
    const lost = allQuotes.filter((q) => q.status === 'LOST').length;
    const expired = allQuotes.filter((q) => q.status === 'EXPIRED').length;

    return {
      totalQuotes: total,
      openQuotes: open,
      orderedQuotes: ordered,
      lostQuotes: lost,
      expiredQuotes: expired,
    };
  }, [allQuotes]);

  // Unique values for dropdown filters
  const uniqueStatuses = useMemo<QuoteStatus[]>(() => {
    return ['OPEN', 'ORDERED', 'EXPIRED', 'LOST'];
  }, []);

  const uniquePipelineStages = useMemo<QuotePipelineStage[]>(() => {
    return ['DISCOVERY', 'PROSPECT', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  }, []);

  // Handlers
  const handleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev?.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return null;
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  }, []);

  const handleQuoteDeleted = useCallback(() => {
    setDeleteConfirmId(null);
    refetch();
  }, [refetch]);

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    filteredQuotes,
    stats,
    totalCount,
    // Sort state
    sortState,
    handleSort,
    columnFilters,
    handleColumnFilterChange,
    // Delete modal
    deleteConfirmId,
    setDeleteConfirmId,
    // Loading state
    isLoading,
    error,
    isMounted,
    refetch,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Filter options
    uniqueStatuses,
    uniquePipelineStages,
    // Handlers
    handleQuoteDeleted,
  };
}
