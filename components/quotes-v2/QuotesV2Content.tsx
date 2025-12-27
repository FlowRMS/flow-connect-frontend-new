'use client';

import React, { useState, useMemo } from 'react';
import type { QuoteV2 } from './types';
import { mockQuotesV2 } from './data/mockData';
import { KanbanViewV2 } from './views/KanbanViewV2';
import { ListViewV2 } from './views/ListViewV2';
import { QuoteDetailV2 } from './QuoteDetailV2';

type ViewMode = 'kanban' | 'list';
type QuickFilter = 'all' | 'today' | 'this_week' | 'last_week';

export function QuotesV2Content() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Data state
  const [quotes, setQuotes] = useState<QuoteV2[]>(mockQuotesV2);
  const [selectedQuote, setSelectedQuote] = useState<QuoteV2 | null>(null);

  // Computed totals
  const totals = useMemo(() => {
    const pipeline = quotes.reduce((sum, q) => sum + q.quoteAmount, 0);
    const wonYTD = quotes
      .filter((q) => q.stage === 'Won')
      .reduce((sum, q) => sum + q.quoteAmount, 0);
    return { pipeline, wonYTD };
  }, [quotes]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const handleQuoteClick = (quote: QuoteV2) => {
    setSelectedQuote(quote);
  };

  const handleBackFromDetail = () => {
    setSelectedQuote(null);
  };

  // Show detail page if a quote is selected
  if (selectedQuote) {
    return (
      <QuoteDetailV2
        quote={selectedQuote}
        onBack={handleBackFromDetail}
      />
    );
  }

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

            {/* Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
              </svg>
              Advanced Filters
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
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Quote Date</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Amount</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Win Probability</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Customer Name</button>
                  </div>
                </>
              )}
            </div>

            {/* New Quote */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
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

          {/* Entry Date Filter */}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors ml-2">
            Entry Date
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {viewMode === 'kanban' ? (
          <KanbanViewV2 quotes={quotes} onQuoteClick={handleQuoteClick} />
        ) : (
          <ListViewV2 quotes={quotes} onQuoteClick={handleQuoteClick} />
        )}
      </div>
    </div>
  );
}

export default QuotesV2Content;
