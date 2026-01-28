'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '../ui/HeaderIconAnimations';
import { iconMap } from '../Sidebar';
import type { RefObject } from 'react';
import type { QuoteV2, QuoteLandingPageFilter, QuoteLandingPageOrderBy } from './types';
import type { QuotePipelineStage } from './types';
import { transformLandingPageToQuoteV2 } from './types';
import { KanbanViewV2 } from './views/KanbanViewV2';
import { ListViewV2 } from './views/ListViewV2';
import { useQuotesV2Infinite, useUpdateQuoteStageV2, useQuoteSearchV2, type QuoteSearchResult } from './api/quotesV2Api';
import { fetchAllQuoteIds } from '../quotes/api/quotesApi';
import { quoteToasts } from '../lib/toast';
import AdvancedFilters from '../advancedFilters/AdvancedFilters';
import type { ActiveFilter, FilterOperator } from '../advancedFilters/types';
import { getQuoteFilterOptions } from './config/filterConfig';
import { formatDateToISO, formatDateToBackend, parseDateString } from '../advancedFilters/utils';
import { useFilterSync } from '../advancedFilters/hooks/useFilterSync';
import { useBulkSelection, SaveViewButton } from '../shared';
import { BulkDeleteModal, BulkActionsToolbar } from '../shared';
import { useSortState } from '@/components/shared/sorting/hooks/useSortState';
import { useQuoteSettings } from '@/contexts/UserSettingsContext';
import type { SavedViewState } from '@/components/lib/graphql/settings';
import { SortMenu } from '@/components/shared/sorting/components/SortMenu';
import { QUOTE_SORT_CONFIGS, DEFAULT_QUOTE_SORT } from './config/sortConfig';

type ViewMode = 'kanban' | 'list';
type QuickFilter = 'all' | 'today' | 'this_week' | 'last_week';
type QuickDateField = 'createdAt' | 'entityDate';

export function QuotesV2Content() {
  const router = useRouter();

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'quotes';

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('createdAt');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Unified sort state using the generic hook
  const sortState = useSortState({
    configs: QUOTE_SORT_CONFIGS,
    defaultSort: DEFAULT_QUOTE_SORT,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Settings for saving view
  const { settings: quoteSettings, saveSettings: saveQuoteSettings, isLoading: isSettingsLoading, isInitialized: isSettingsInitialized } = useQuoteSettings();
  const savedView = quoteSettings?.savedView;
  const hasAppliedSavedView = useRef(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<QuoteLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  
  // Initialize columnFiltersToAPI as empty (will be computed after uniqueQuoteNumbers/uniqueCreators)
  // This allows filters to be computed before the hook
  const [columnFiltersToAPIState, setColumnFiltersToAPIState] = useState<QuoteLandingPageFilter[]>([]);
  
  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);

  // Map from UI column keys to filter option IDs (for sync)
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    quoteNumber: 'quote-number',
    status: 'status',
    pipelineStage: 'pipeline-stage',
    quoteAmount: 'total-amount',
    commission: 'commission',
    entryDate: 'created-date',
    quoteDate: 'quote-date',
    expirationDate: 'expiration-date',
    published: 'published',
    endUsers: 'end-users',
  }), []);

  // We initialize with empty arrays to avoid dependency issues
  const quoteFilterOptionsForSync = useMemo(() => {
    // Try to use uniqueQuoteNumbers and uniqueCreators if available, otherwise empty arrays
    // Note: uniqueQuoteNumbers and uniqueCreators are defined later, so we use empty arrays initially
    return getQuoteFilterOptions([], []);
  }, []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: quoteFilterOptionsForSync,
    columnKeyToFilterId,
  });
  
  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Convert ActiveFilter to QuoteLandingPageFilter
    // Only include value OR values, not both - check which one exists
    const apiFilters: QuoteLandingPageFilter[] = filters.map(f => {
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
    setServerFilters(apiFilters);

    // Sync to ColumnFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from column filters to avoid infinite loop
    if (!isSyncingFromColumn.current) {
      isSyncingFromAdvanced.current = true;
      const syncedColumnFilters = syncAdvancedToColumn(filters);
      setColumnFilters((prev) => {
        // If filters array is empty, clear all column filters
        // Otherwise, merge: new filters from AdvancedFilters replace old ones for same columns
        if (filters.length === 0) {
          return {};
        }
        return { ...prev, ...syncedColumnFilters };
      });
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromAdvanced.current = false;
      }, 0);
    }
  }, [syncAdvancedToColumn]);
  
  // Handler for column filter changes (from ColumnFilters)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    // Sync to AdvancedFilters (most recent filter replaces previous one for same column)
    // Only sync if not already syncing from advanced filters to avoid infinite loop
    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters = syncColumnToAdvanced(filters);
      setActiveFilters(syncedActiveFilters);
      
      // Also update serverFilters to trigger API call
      const apiFilters: QuoteLandingPageFilter[] = syncedActiveFilters.map(f => {
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
      setServerFilters(apiFilters);
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [syncColumnToAdvanced]);

  // Build quick filters based on quick filter selection
  const quickFilters = useMemo<QuoteLandingPageFilter[]>(() => {
    const result: QuoteLandingPageFilter[] = [];

    if (quickFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (quickFilter) {
        case 'today': {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate = today;
          // End of today (23:59:59.999)
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        }
        case 'this_week': {
          const dayOfWeek = now.getDay();
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          startDate = startOfWeek;
          // End of this week (Saturday 23:59:59.999)
          endDate = new Date(startOfWeek);
          endDate.setDate(startOfWeek.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case 'last_week': {
          const dayOfWeek = now.getDay();
          const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          const startOfLastWeek = new Date(startOfThisWeek);
          startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
          startDate = startOfLastWeek;
          // End of last week (Saturday 23:59:59.999)
          endDate = new Date(startOfLastWeek);
          endDate.setDate(startOfLastWeek.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        default:
          startDate = new Date(0);
          endDate = now;
      }

      // Use quickDateField to determine which column to filter (createdAt or entityDate)
      const columnName = quickDateField;
      
      // Format date based on column type:
      // - entityDate (Quote Date): YYYY-MM-DD format (date only)
      // - createdAt: Backend format '%Y-%m-%d %H:%M:%S' (datetime with time)
      const formatDate = (date: Date): string => {
        if (columnName === 'entityDate') {
          return formatDateToISO(date); // Returns YYYY-MM-DD
        }
        return formatDateToBackend(date); // Returns 'YYYY-MM-DD HH:MM:SS'
      };

      result.push({
        columnName,
        operator: 'GTE',
        value: formatDate(startDate),
      });

      result.push({
        columnName,
        operator: 'LTE',
        value: formatDate(endDate),
      });
    }

    return result;
  }, [quickFilter, quickDateField]);

  // Build order by from unified sort state
  const orderBy = useMemo<QuoteLandingPageOrderBy[]>(() => {
    return sortState.toOrderBy();
  }, [sortState]);

  // Combine all filters (uses columnFiltersToAPIState which will be updated when columnFiltersToAPI is computed)
  const filters = useMemo<QuoteLandingPageFilter[]>(() => {
    return [...quickFilters, ...serverFilters, ...columnFiltersToAPIState];
  }, [quickFilters, serverFilters, columnFiltersToAPIState]);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    return (
      quickFilters.length > 0 ||
      serverFilters.length > 0 ||
      columnFiltersToAPIState.length > 0 ||
      Object.keys(columnFilters).length > 0
    );
  }, [quickFilters, serverFilters, columnFiltersToAPIState, columnFilters]);

  // Fetch quotes from API with infinite scroll
  // React Query will auto-update when filters change (via queryKey)
  const {
    data: quotesData,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuotesV2Infinite(filters, orderBy);

  const updateStageMutation = useUpdateQuoteStageV2();

  // Search quotes
  const { data: searchResults, isLoading: isSearching } = useQuoteSearchV2(searchQuery, 100);

  // Flatten paginated data with deduplication
  const allQuotesData = useMemo(() => {
    if (!quotesData?.pages) return [];
    const allRecords = quotesData.pages.flatMap(page => page.records);
    // Deduplicate by ID to prevent duplicate keys in React
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [quotesData]);

  
  const uniqueQuoteNumbers = useMemo(() => {
    if (!allQuotesData.length) return [];
    const numbers = new Set<string>();
    allQuotesData.forEach(quote => {
      if (quote.quoteNumber) numbers.add(quote.quoteNumber);
    });
    return Array.from(numbers).sort();
  }, [allQuotesData]);

  const uniqueCreators = useMemo(() => {
    if (!allQuotesData.length) return [];
    const creators = new Set<string>();
    allQuotesData.forEach(quote => {
      if (quote.createdBy) creators.add(quote.createdBy);
    });
    return Array.from(creators).sort();
  }, [allQuotesData]);

  // Get filter options (updated with unique values)
  const quoteFilterOptionsWithValues = useMemo(() => {
    return getQuoteFilterOptions(
      uniqueQuoteNumbers,
      uniqueCreators
    );
  }, [uniqueQuoteNumbers, uniqueCreators]);

  // Convert column filters (Record<string, ActiveFilter[]>) to QuoteLandingPageFilter[]
  // Now much simpler since columnFilters already uses ActiveFilter[]
  const columnFiltersToAPI = useMemo<QuoteLandingPageFilter[]>(() => {
    const filters: QuoteLandingPageFilter[] = [];
    
    // Flatten all column filters into a single array
    Object.values(columnFilters).forEach((columnFilterArray) => {
      columnFilterArray.forEach((filter) => {
        // Convert ActiveFilter to QuoteLandingPageFilter
        if (filter.values && filter.values.length > 0) {
          filters.push({
            operator: filter.operator,
            columnName: filter.columnName,
            values: filter.values,
          });
        } else if (filter.value) {
          filters.push({
            operator: filter.operator,
            columnName: filter.columnName,
            value: filter.value,
          });
        }
      });
    });
    
    return filters;
  }, [columnFilters]);

  // Update state when columnFiltersToAPI changes
  useEffect(() => {
    setColumnFiltersToAPIState(columnFiltersToAPI);
  }, [columnFiltersToAPI]);

  // Apply saved view when settings are loaded (only once on mount)
  useEffect(() => {
    if (isSettingsInitialized && savedView && !hasAppliedSavedView.current) {
      hasAppliedSavedView.current = true;

      // Apply saved filters
      if (savedView.filters && savedView.filters.length > 0) {
        const restoredFilters: ActiveFilter[] = savedView.filters.map((f) => ({
          operator: f.operator as FilterOperator,
          columnName: f.columnName,
          value: f.value,
          values: f.values,
        }));
        setActiveFilters(restoredFilters);
        const apiFilters: QuoteLandingPageFilter[] = restoredFilters.map(f => {
          if (f.values && f.values.length > 0) {
            return { operator: f.operator, columnName: f.columnName, values: f.values };
          }
          return { operator: f.operator, columnName: f.columnName, value: f.value };
        });
        setServerFilters(apiFilters);
      }

      // Apply saved column filters
      if (savedView.columnFilters && Object.keys(savedView.columnFilters).length > 0) {
        const restoredColumnFilters: Record<string, ActiveFilter[]> = {};
        Object.entries(savedView.columnFilters).forEach(([key, filters]) => {
          restoredColumnFilters[key] = filters.map((f) => ({
            operator: f.operator as FilterOperator,
            columnName: f.columnName,
            value: f.value,
            values: f.values,
          }));
        });
        setColumnFilters(restoredColumnFilters);
      }

      // Apply saved sort
      if (savedView.sortField && savedView.sortDirection) {
        sortState.setSort(savedView.sortField, savedView.sortDirection.toUpperCase() as 'ASC' | 'DESC');
      }

      // Apply saved quick date preset
      if (savedView.quickDatePreset) {
        setQuickFilter(savedView.quickDatePreset as QuickFilter);
      }

      // Apply saved quick date field
      if (savedView.quickDateField) {
        setQuickDateField(savedView.quickDateField as QuickDateField);
      }

      // Apply saved view mode
      if (savedView.viewMode) {
        setViewMode(savedView.viewMode as ViewMode);
      }
    }
  }, [isSettingsInitialized, savedView, sortState]);


  // Transform API data to UI format, using search results when searching
  const quotes = useMemo<QuoteV2[]>(() => {
    // If searching and we have results, transform search results
    if (searchQuery.length >= 2 && searchResults) {
      // Deduplicate search results as well to prevent duplicate keys
      const seen = new Set<string>();
      const uniqueSearchResults = searchResults.filter((result: QuoteSearchResult) => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      });
      
      return uniqueSearchResults.map((result: QuoteSearchResult) => ({
        id: result.id,
        quoteNumber: result.quoteNumber,
        stage: 'Draft' as const,
        status: (result.status || 'OPEN') as 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST',
        pipelineStage: result.pipelineStage as QuotePipelineStage | undefined,
        apiStatus: result.status as 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST' | undefined,
        published: result.published,
        soldToCustomerId: result.soldToCustomerId || '',
        soldToCustomerName: '',
        billToCustomerId: result.billToCustomerId || '',
        billToCustomerName: '',
        jobId: '',
        jobName: '',
        quoteAmount: 0,
        basePrice: 0,
        sellPrice: 0,
        commission: 0,
        winProbability: 0,
        approvalStatus: 'clear' as const,
        pendingApprovals: 0,
        blockedApprovals: 0,
        quoteDate: result.entityDate || '',
        expirationDate: result.expDate || '',
        entryDate: result.createdAt || '',
        paymentTerms: result.paymentTerms || '',
        freightTerms: result.freightTerms || '',
        version: 1,
        tags: [],
        factoriesCount: 0,
        endUsersCount: 0,
        createdById: result.createdById,
      }));
    }

    if (!allQuotesData.length) return [];
    return allQuotesData.map(transformLandingPageToQuoteV2);
  }, [allQuotesData, searchQuery, searchResults]);


  // Get total count from first page
  const totalCount = useMemo(() => {
    if (!quotesData?.pages || quotesData.pages.length === 0) return 0;
    return quotesData.pages[0].total;
  }, [quotesData]);

  // Bulk selection hook
  const bulkSelection = useBulkSelection({
    items: quotes,
    totalCount,
    fetchAllIds: fetchAllQuoteIds,
  });

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle successful bulk delete
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetch();
  }, [bulkSelection, refetch]);

  // Get current view state for saving
  const getCurrentViewState = useCallback((): SavedViewState => ({
    filters: activeFilters.map(f => ({
      operator: f.operator,
      columnName: f.columnName,
      value: f.value,
      values: f.values,
    })),
    columnFilters: Object.fromEntries(
      Object.entries(columnFilters).map(([key, filters]) => [
        key,
        filters.map(f => ({
          operator: f.operator,
          columnName: f.columnName,
          value: f.value,
          values: f.values,
        })),
      ])
    ),
    sortField: sortState.activeSort?.columnId,
    sortDirection: sortState.activeSort?.direction?.toLowerCase() as 'asc' | 'desc' | undefined,
    quickDatePreset: quickFilter,
    quickDateField: quickDateField,
    viewMode: viewMode,
  }), [activeFilters, columnFilters, sortState.activeSort, quickFilter, quickDateField, viewMode]);

  // Save current view state
  const handleSaveView = useCallback(async (viewState: SavedViewState): Promise<boolean> => {
    const updatedSettings = {
      ...quoteSettings,
      columnConfig: quoteSettings?.columnConfig || [],
      specifyEndUserPerLine: quoteSettings?.specifyEndUserPerLine ?? false,
      outsideRepAtLineLevel: quoteSettings?.outsideRepAtLineLevel ?? false,
      insideRepAtLineLevel: quoteSettings?.insideRepAtLineLevel ?? false,
      factoryPerLineItem: quoteSettings?.factoryPerLineItem ?? false,
      customerPartNumberSource: quoteSettings?.customerPartNumberSource ?? 'sold_to' as const,
      savedView: viewState,
    };
    return saveQuoteSettings(updatedSettings, 'my');
  }, [quoteSettings, saveQuoteSettings]);

  // Clear saved view state
  const handleClearView = useCallback(async (): Promise<boolean> => {
    const updatedSettings = {
      ...quoteSettings,
      columnConfig: quoteSettings?.columnConfig || [],
      specifyEndUserPerLine: quoteSettings?.specifyEndUserPerLine ?? false,
      outsideRepAtLineLevel: quoteSettings?.outsideRepAtLineLevel ?? false,
      insideRepAtLineLevel: quoteSettings?.insideRepAtLineLevel ?? false,
      factoryPerLineItem: quoteSettings?.factoryPerLineItem ?? false,
      customerPartNumberSource: quoteSettings?.customerPartNumberSource ?? 'sold_to' as const,
      savedView: undefined,
    };
    const success = await saveQuoteSettings(updatedSettings, 'my');
    if (success) {
      window.location.reload();
    }
    return success;
  }, [quoteSettings, saveQuoteSettings]);

  const hasSavedView = !!quoteSettings?.savedView;

  // Computed totals
  const totals = useMemo(() => {
    const pipeline = quotes.reduce((sum, q) => sum + q.quoteAmount, 0);
    const wonYTD = quotes
      .filter((q) => q.stage === 'Won')
      .reduce((sum, q) => sum + q.quoteAmount, 0);
    return { pipeline, wonYTD };
  }, [quotes]);

  const formatCurrency = (amount: number): string => {
    const numAmount = Number(amount) || 0;
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`;
    }
    if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`;
    }
    return `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleQuoteClick = useCallback((quote: QuoteV2) => {
    router.push(`/quotes-v2/${quote.id}`);
  }, [router]);

  const handleNewQuote = useCallback(() => {
    router.push('/quotes-v2/new');
  }, [router]);

  // Handle stage change from Kanban drag & drop
  const handleStageChange = useCallback(async (quoteId: string, newStage: QuotePipelineStage) => {
    const quote = quotes.find((q) => q.id === quoteId);
    const stageName = newStage.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    try {
      await updateStageMutation.mutateAsync({ quoteId, pipelineStage: newStage });
      quoteToasts.stageChanged(quote?.quoteNumber || quoteId, stageName);
    } catch (err) {
      quoteToasts.stageChangeError(err instanceof Error ? err.message : 'Failed to update stage');
    }
  }, [updateStageMutation, quotes]);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target - Document Stack Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="document-stack"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['quotes']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl font-semibold text-gray-900"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Quotes
              </motion.h1>
              <motion.p
                className="text-sm text-gray-500 mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {searchQuery.length >= 2
                  ? `${quotes.length} results for "${searchQuery}"`
                  : `Showing ${quotes.length} of ${totalCount} quotes`}
              </motion.p>
            </div>
          </div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* Search Bar */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {isSearching && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                </div>
              )}
            </div>

            {/* Pipeline & Won YTD */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Pipeline</span>
                <span className="ml-2 font-semibold text-gray-900">{formatCurrency(totals.pipeline)}</span>
              </div>
              <div>
                <span className="text-gray-500">Won YTD</span>
                <span className="ml-2 font-semibold text-green-600">{formatCurrency(totals.wonYTD)}</span>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Kanban View"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={viewMode === 'kanban' ? 'text-gray-900' : 'text-gray-500'}>
                  <rect x="3" y="3" width="4" height="14" rx="1" />
                  <rect x="8" y="3" width="4" height="10" rx="1" />
                  <rect x="13" y="3" width="4" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}>
                  <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Advanced Filters */}
              <AdvancedFilters
                filterOptions={quoteFilterOptionsWithValues}
                onFiltersChange={handleServerFiltersChange}
                activeFilters={activeFilters}
              />

            {/* Sort */}
            <SortMenu
              options={sortState.getMenuOptions()}
              activeSort={sortState.activeSort}
              onSortChange={sortState.toggleSort}
              isOpen={showSortMenu}
              onToggle={setShowSortMenu}
            />

            {/* Save View */}
            <SaveViewButton
              onSave={handleSaveView}
              onClear={handleClearView}
              getCurrentViewState={getCurrentViewState}
              hasSavedView={hasSavedView}
              isSaving={isSettingsLoading}
            />

            {/* New Quote */}
            <button
              onClick={handleNewQuote}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 7v6M7 10h6" strokeLinecap="round" />
              </svg>
              New Quote
            </button>
          </motion.div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm text-gray-500">Quick filter:</span>
          <div className="flex items-center gap-1">
            {(['all', 'today', 'this_week', 'last_week'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  quickFilter === filter
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter === 'all' && 'All'}
                {filter === 'today' && 'Today'}
                {filter === 'this_week' && 'This Week'}
                {filter === 'last_week' && 'Last Week'}
              </button>
            ))}
          </div>

          {/* Date Field Selector */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowQuickDateFieldDropdown(!showQuickDateFieldDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition-colors"
            >
              <span>
                {quickDateField === 'createdAt' ? 'Entry Date' : 'Quote Date'}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 8l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showQuickDateFieldDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowQuickDateFieldDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      setQuickDateField('createdAt');
                      setShowQuickDateFieldDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                      quickDateField === 'createdAt'
                        ? 'text-indigo-600 font-medium bg-indigo-50'
                        : 'text-gray-700'
                    }`}
                  >
                    Entry Date
                  </button>
                  <button
                    onClick={() => {
                      setQuickDateField('entityDate');
                      setShowQuickDateFieldDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                      quickDateField === 'entityDate'
                        ? 'text-indigo-600 font-medium bg-indigo-50'
                        : 'text-gray-700'
                    }`}
                  >
                    Quote Date
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          entityType="QUOTES"
          selectedCount={bulkSelection.selectedCount}
          totalCount={totalCount}
          loadedCount={quotes.length}
          selectAllMode={bulkSelection.selectAllMode}
          onClearSelection={bulkSelection.clearSelection}
          onDelete={() => setShowBulkDeleteModal(true)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-4">Failed to load quotes: {error.message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'kanban' ? (
              <KanbanViewV2
                quotes={quotes}
                onQuoteClick={handleQuoteClick}
                onStageChange={handleStageChange}
                onLoadMore={() => {
                  if (hasNextPage && !isFetchingNextPage && !searchQuery) {
                    fetchNextPage();
                  }
                }}
                hasMore={hasNextPage && !searchQuery}
                isLoadingMore={isFetchingNextPage}
              />
            ) : (
              <>
                <ListViewV2
                  quotes={quotes}
                  onQuoteClick={handleQuoteClick}
                  isItemSelected={bulkSelection.isItemSelected}
                  isAllSelected={bulkSelection.isAllSelected}
                  isPartiallySelected={bulkSelection.isPartiallySelected}
                  onSelectAll={bulkSelection.handleSelectAll}
                  onSelectOne={bulkSelection.handleSelectOne}
                  onColumnFiltersChange={handleColumnFiltersChange}
                  filterOptions={quoteFilterOptionsWithValues}
                  columnFilters={columnFilters}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  hasActiveFilters={hasActiveFilters}
                  activeSort={sortState.activeSort}
                  onSortChange={sortState.toggleSort}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  searchQuery={searchQuery}
                />

                {/* Loading indicator for infinite scroll - list view */}
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                    <span className="ml-2 text-sm text-gray-500">Loading more quotes...</span>
                  </div>
                )}

                {/* End of list indicator - list view */}
                {!hasNextPage && quotes.length > 0 && !searchQuery && (
                  <div className="text-center py-4 text-sm text-gray-400">
                    All {totalCount} quotes loaded
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="QUOTES"
        selectedCount={bulkSelection.selectedCount}
        getAllSelectedIds={bulkSelection.getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['quotes-v2'], ['quotes']]}
      />
    </div>
  );
}

export default QuotesV2Content;
