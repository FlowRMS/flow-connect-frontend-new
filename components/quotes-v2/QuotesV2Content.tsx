'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { QuoteV2, QuoteLandingPageFilter, QuoteLandingPageOrderBy } from './types';
import type { QuotePipelineStage } from './types';
import { transformLandingPageToQuoteV2 } from './types';
import { KanbanViewV2 } from './views/KanbanViewV2';
import { ListViewV2 } from './views/ListViewV2';
import { useQuotesV2Infinite, useUpdateQuoteStageV2, useQuoteSearchV2, type QuoteSearchResult } from './api/quotesV2Api';
import { fetchAllQuoteIds } from '../quotes/api/quotesApi';
import { quoteToasts } from '../lib/toast';
import { useBulkSelection } from '../shared';
import { BulkDeleteModal, BulkActionsToolbar } from '../shared';

type ViewMode = 'kanban' | 'list';
type QuickFilter = 'all' | 'today' | 'this_week' | 'last_week';
type SortOption = 'createdAt' | 'entityDate' | 'total' | 'quoteNumber';

export function QuotesV2Content() {
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Build filters based on quick filter selection
  const filters = useMemo<QuoteLandingPageFilter[]>(() => {
    const result: QuoteLandingPageFilter[] = [];

    if (quickFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (quickFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'this_week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          break;
        case 'last_week':
          const lastWeekDay = now.getDay();
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay - 1);
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6);
          break;
        default:
          startDate = new Date(0);
      }

      result.push({
        columnName: 'createdAt',
        operator: 'GTE',
        value: startDate.toISOString(),
      });

      if (quickFilter === 'last_week') {
        result.push({
          columnName: 'createdAt',
          operator: 'LTE',
          value: endDate.toISOString(),
        });
      }
    }

    return result;
  }, [quickFilter]);

  // Build order by
  const orderBy = useMemo<QuoteLandingPageOrderBy[]>(() => {
    return [{ columnName: sortBy, direction: sortDirection }];
  }, [sortBy, sortDirection]);

  // Fetch quotes from API with infinite scroll
  const {
    data: quotesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuotesV2Infinite(filters, orderBy);

  const updateStageMutation = useUpdateQuoteStageV2();

  // Search quotes
  const { data: searchResults, isLoading: isSearching } = useQuoteSearchV2(searchQuery, 100);

  // Flatten paginated data
  const allQuotesData = useMemo(() => {
    if (!quotesData?.pages) return [];
    return quotesData.pages.flatMap(page => page.records);
  }, [quotesData]);

  // Transform API data to UI format, using search results when searching
  const quotes = useMemo<QuoteV2[]>(() => {
    // If searching and we have results, transform search results
    if (searchQuery.length >= 2 && searchResults) {
      return searchResults.map((result: QuoteSearchResult) => ({
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

  // Scroll-based pagination - load more when scrolling near bottom
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Load more when within 200px of bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        if (hasNextPage && !isFetchingNextPage && !searchQuery) {
          fetchNextPage();
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

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

  const handleSortChange = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(option);
      setSortDirection('DESC');
    }
    setShowSortMenu(false);
  }, [sortBy]);

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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery.length >= 2
                ? `${quotes.length} results for "${searchQuery}"`
                : `Showing ${quotes.length} of ${totalCount} quotes`}
            </p>
          </div>

          <div className="flex items-center gap-4">
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

            {/* Advanced Filters - Coming Soon */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
              disabled
              title="Coming Soon"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
              </svg>
              Advanced Filters
              <span className="text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded uppercase">Soon</span>
            </button>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h4M3 12h8M3 17h12" strokeLinecap="round" />
                </svg>
                Sort
                {sortDirection === 'DESC' ? ' ↓' : ' ↑'}
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => handleSortChange('entityDate')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === 'entityDate' ? 'bg-gray-50' : ''}`}
                    >
                      Quote Date
                      {sortBy === 'entityDate' && <span>{sortDirection === 'DESC' ? '↓' : '↑'}</span>}
                    </button>
                    <button
                      onClick={() => handleSortChange('total')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === 'total' ? 'bg-gray-50' : ''}`}
                    >
                      Amount
                      {sortBy === 'total' && <span>{sortDirection === 'DESC' ? '↓' : '↑'}</span>}
                    </button>
                    <button
                      onClick={() => handleSortChange('createdAt')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === 'createdAt' ? 'bg-gray-50' : ''}`}
                    >
                      Created Date
                      {sortBy === 'createdAt' && <span>{sortDirection === 'DESC' ? '↓' : '↑'}</span>}
                    </button>
                    <button
                      onClick={() => handleSortChange('quoteNumber')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${sortBy === 'quoteNumber' ? 'bg-gray-50' : ''}`}
                    >
                      Quote Number
                      {sortBy === 'quoteNumber' && <span>{sortDirection === 'DESC' ? '↓' : '↑'}</span>}
                    </button>
                    {/* Win Probability - Coming Soon */}
                    <button
                      disabled
                      className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center justify-between"
                    >
                      Win Probability
                      <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded uppercase">Soon</span>
                    </button>
                    {/* Customer Name - Coming Soon */}
                    <button
                      disabled
                      className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center justify-between"
                    >
                      Customer Name
                      <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded uppercase">Soon</span>
                    </button>
                  </div>
                </>
              )}
            </div>

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
          </div>
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

          {/* Entry Date Filter - Coming Soon */}
          <button
            disabled
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed rounded-md ml-2"
            title="Coming Soon"
          >
            Entry Date
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded uppercase ml-1">Soon</span>
          </button>
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
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4">
        {isLoading && quotes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading quotes...</p>
            </div>
          </div>
        ) : error ? (
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
