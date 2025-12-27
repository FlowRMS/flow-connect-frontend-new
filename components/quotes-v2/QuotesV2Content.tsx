'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { QuoteV2, QuoteLandingPageFilter, QuoteLandingPageOrderBy, QuotePipelineStage } from './types';
import { transformLandingPageToQuoteV2 } from './types';
import { KanbanViewV2 } from './views/KanbanViewV2';
import { ListViewV2 } from './views/ListViewV2';
import { useQuotesV2, useUpdateQuoteStageV2 } from './api/quotesV2Api';
import { quoteToasts } from '../lib/toast';

type ViewMode = 'kanban' | 'list';
type QuickFilter = 'all' | 'today' | 'this_week' | 'last_week';
type SortOption = 'createdAt' | 'entityDate' | 'total' | 'quoteNumber';

export function QuotesV2Content() {
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

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

  // Fetch quotes from API
  const { data: quotesData, isLoading, error, refetch } = useQuotesV2(filters, orderBy);
  const updateStageMutation = useUpdateQuoteStageV2();

  // Transform API data to UI format
  const quotes = useMemo<QuoteV2[]>(() => {
    if (!quotesData) return [];
    return quotesData.map(transformLandingPageToQuoteV2);
  }, [quotesData]);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>

          <div className="flex items-center gap-4">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {isLoading ? (
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
        ) : viewMode === 'kanban' ? (
          <KanbanViewV2 quotes={quotes} onQuoteClick={handleQuoteClick} onStageChange={handleStageChange} />
        ) : (
          <ListViewV2 quotes={quotes} onQuoteClick={handleQuoteClick} />
        )}
      </div>
    </div>
  );
}

export default QuotesV2Content;
