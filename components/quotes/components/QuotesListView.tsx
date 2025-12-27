'use client';

import React from 'react';
import type { Quote } from '../types';
import { WinProbabilityBadge, ApprovalStatusBadge } from './index';

type QuoteSortKey = 'id' | 'status' | 'valueNumber' | 'entryDate' | 'quoteDate' | 'expirationDate' | 'expDate' | 'factories' | 'factory' | 'soldToCustomer' | 'customer' | 'jobName' | 'endUsers' | 'insideReps' | 'outsideReps' | 'published' | 'stage' | 'billToCustomer' | 'billTo' | 'winProbability' | 'approvalStatus' | 'tags' | 'quoteAmount';

type QuoteFilterValue = {
  type: 'text' | 'select' | 'multiselect' | 'daterange';
  value: string;
  values?: string[];
  dateFrom?: string;
  dateTo?: string;
};

interface QuotesListViewProps {
  sortedQuotes: Quote[];
  selectedQuotesForBulk: Set<string>;
  setSelectedQuotesForBulk: React.Dispatch<React.SetStateAction<Set<string>>>;
  showQuotesBulkActionsMenu: boolean;
  setShowQuotesBulkActionsMenu: (value: boolean) => void;
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  setShowMarkAsLostModal: (value: boolean) => void;
  isQuoteLinked: (quote: Quote) => boolean;
  getQuoteLinkedReason: (quote: Quote) => string;
  getStageColor: (stage: string) => string;
  handleQuotesSort: (column: QuoteSortKey) => void;
  quotesSortColumn: QuoteSortKey | null;
  quotesSortDirection: 'asc' | 'desc';
  activeQuoteSortKey: QuoteSortKey | null;
  setActiveQuoteSortKey: (column: QuoteSortKey | null) => void;
  filterSearchText: string;
  setFilterSearchText: (text: string) => void;
  hasActiveFilter: (column: QuoteSortKey) => boolean;
  quoteColumnFilters: Record<QuoteSortKey, QuoteFilterValue | null>;
  handleQuoteFilterChange: (column: QuoteSortKey, filter: QuoteFilterValue | null) => void;
  clearQuoteFilter: (column: QuoteSortKey) => void;
  getUniqueValuesForColumn: (column: QuoteSortKey) => string[];
  getFilterType: (column: QuoteSortKey) => 'text' | 'select' | 'multiselect' | 'daterange';
  setSelectedQuote: (quote: Quote | null) => void;
}

export function QuotesListView({
  sortedQuotes,
  selectedQuotesForBulk,
  setSelectedQuotesForBulk,
  showQuotesBulkActionsMenu,
  setShowQuotesBulkActionsMenu,
  setQuotes,
  setShowMarkAsLostModal,
  isQuoteLinked,
  getQuoteLinkedReason,
  getStageColor,
  handleQuotesSort,
  quotesSortColumn,
  quotesSortDirection,
  activeQuoteSortKey,
  setActiveQuoteSortKey,
  filterSearchText,
  setFilterSearchText,
  hasActiveFilter,
  quoteColumnFilters,
  handleQuoteFilterChange,
  clearQuoteFilter,
  getUniqueValuesForColumn,
  getFilterType,
  setSelectedQuote,
}: QuotesListViewProps) {
  // Render filter dropdown content based on filter type
  const renderFilterDropdown = (column: QuoteSortKey, label: string) => {
    const filterType = getFilterType(column);
    const currentFilter = quoteColumnFilters[column];
    const uniqueValues = ['select', 'multiselect'].includes(filterType) ? getUniqueValuesForColumn(column) : [];
    const filteredValues = uniqueValues.filter(v =>
      v.toLowerCase().includes(filterSearchText.toLowerCase())
    );

    // For published column, provide Yes/No options
    const publishedOptions = column === 'published' ? ['Yes', 'No'] : filteredValues;
    const displayValues = column === 'published' ? publishedOptions : filteredValues;

    return (
      <div
        className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-30 min-w-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        {filterType === 'text' && (
          <>
            <input
              type="text"
              placeholder={`Filter ${label}...`}
              value={currentFilter?.value || ''}
              onChange={(e) => handleQuoteFilterChange(column, { type: 'text', value: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />
            {currentFilter?.value && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </>
        )}

        {filterType === 'select' && (
          <>
            <div className="max-h-[200px] overflow-y-auto">
              {displayValues.map(value => (
                <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                  <input
                    type="radio"
                    name={`filter-${column}`}
                    checked={currentFilter?.value === value}
                    onChange={() => handleQuoteFilterChange(column, { type: 'select', value })}
                    className="rounded-full"
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
            {currentFilter?.value && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] block w-full text-left px-2"
              >
                Clear filter
              </button>
            )}
          </>
        )}

        {filterType === 'multiselect' && (
          <>
            <input
              type="text"
              placeholder="Search..."
              value={filterSearchText}
              onChange={(e) => setFilterSearchText(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
              autoFocus
            />
            <div className="max-h-[200px] overflow-y-auto">
              {displayValues.map(value => (
                <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilter?.values?.includes(value) || false}
                    onChange={(e) => {
                      const currentValues = currentFilter?.values || [];
                      const newValues = e.target.checked
                        ? [...currentValues, value]
                        : currentValues.filter(v => v !== value);
                      if (newValues.length === 0) {
                        clearQuoteFilter(column);
                      } else {
                        handleQuoteFilterChange(column, { type: 'multiselect', value: '', values: newValues });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
            {currentFilter?.values && currentFilter.values.length > 0 && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] block w-full text-left px-2"
              >
                Clear all ({currentFilter.values.length} selected)
              </button>
            )}
          </>
        )}

        {filterType === 'daterange' && (
          <>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">From</label>
                <input
                  type="date"
                  value={currentFilter?.dateFrom || ''}
                  onChange={(e) => handleQuoteFilterChange(column, {
                    type: 'daterange',
                    value: '',
                    dateFrom: e.target.value,
                    dateTo: currentFilter?.dateTo
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">To</label>
                <input
                  type="date"
                  value={currentFilter?.dateTo || ''}
                  onChange={(e) => handleQuoteFilterChange(column, {
                    type: 'daterange',
                    value: '',
                    dateFrom: currentFilter?.dateFrom,
                    dateTo: e.target.value
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            {(currentFilter?.dateFrom || currentFilter?.dateTo) && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedQuotesForBulk.size > 0 && (
        <div className="px-4 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]">
            <strong>{selectedQuotesForBulk.size}</strong> quote{selectedQuotesForBulk.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowQuotesBulkActionsMenu(!showQuotesBulkActionsMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Bulk Actions
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showQuotesBulkActionsMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowQuotesBulkActionsMenu(false)} />
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                    {/* Set Status submenu */}
                    <div className="relative group">
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="10" r="8"/>
                            <path d="M10 6v4l2 2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Set Stage
                        </span>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        {(['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost', 'Dormant'] as const).map((stage) => (
                          <button
                            key={stage}
                            onClick={() => {
                              if (stage === 'Lost') {
                                setShowMarkAsLostModal(true);
                                setShowQuotesBulkActionsMenu(false);
                              } else {
                                setQuotes(prev => prev.map(q =>
                                  selectedQuotesForBulk.has(q.id) ? { ...q, stage } : q
                                ));
                                setSelectedQuotesForBulk(new Set());
                                setShowQuotesBulkActionsMenu(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                          >
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStageColor(stage)}`}>
                              {stage}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-[var(--border)] my-1"></div>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${selectedQuotesForBulk.size} quote(s)? This action cannot be undone.`)) {
                          setQuotes(prev => prev.filter(q => !selectedQuotesForBulk.has(q.id)));
                          setSelectedQuotesForBulk(new Set());
                          setShowQuotesBulkActionsMenu(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M5 6v11a2 2 0 002 2h6a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedQuotesForBulk(new Set())}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[2200px]">
          <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
            <tr>
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-[var(--border)] accent-[var(--primary)]"
                  checked={sortedQuotes.filter(q => !isQuoteLinked(q)).length > 0 && sortedQuotes.filter(q => !isQuoteLinked(q)).every(q => selectedQuotesForBulk.has(q.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Only select quotes that are not linked to other entities
                      setSelectedQuotesForBulk(new Set(sortedQuotes.filter(q => !isQuoteLinked(q)).map(q => q.id)));
                    } else {
                      setSelectedQuotesForBulk(new Set());
                    }
                  }}
                />
              </th>
              {/* Preview */}
              <th className="w-10 px-3 py-3 text-center">
                {/* Preview column header - empty */}
              </th>
              {/* Quote Number */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('id')}>Quote Number</span>
                  {quotesSortColumn === 'id' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'id' ? null : 'id'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('id') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'id' && renderFilterDropdown('id', 'Quote Number')}
              </th>
              {/* Status */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('status')}>Status</span>
                  {quotesSortColumn === 'status' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'status' ? null : 'status'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('status') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'status' && renderFilterDropdown('status', 'Status')}
              </th>
              {/* Stage */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('stage')}>Stage</span>
                  {quotesSortColumn === 'stage' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'stage' ? null : 'stage'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('stage') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'stage' && renderFilterDropdown('stage', 'Stage')}
              </th>
              {/* Quote Amount */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('quoteAmount')}>Quote Amount</span>
                  {quotesSortColumn === 'quoteAmount' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'quoteAmount' ? null : 'quoteAmount'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('quoteAmount') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'quoteAmount' && renderFilterDropdown('quoteAmount', 'Quote Amount')}
              </th>
              {/* Bill-To */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('billTo')}>Bill-To</span>
                  {quotesSortColumn === 'billTo' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'billTo' ? null : 'billTo'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('billTo') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'billTo' && renderFilterDropdown('billTo', 'Bill-To')}
              </th>
              {/* Entry Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('entryDate')}>Entry Date</span>
                  {quotesSortColumn === 'entryDate' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'entryDate' ? null : 'entryDate'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('entryDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'entryDate' && renderFilterDropdown('entryDate', 'Entry Date')}
              </th>
              {/* Quote Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('quoteDate')}>Quote Date</span>
                  {quotesSortColumn === 'quoteDate' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'quoteDate' ? null : 'quoteDate'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('quoteDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'quoteDate' && renderFilterDropdown('quoteDate', 'Quote Date')}
              </th>
              {/* Exp. Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('expDate')}>Exp. Date</span>
                  {quotesSortColumn === 'expDate' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'expDate' ? null : 'expDate'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('expDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'expDate' && renderFilterDropdown('expDate', 'Exp. Date')}
              </th>
              {/* Factory */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('factory')}>Factory</span>
                  {quotesSortColumn === 'factory' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'factory' ? null : 'factory'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('factory') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'factory' && renderFilterDropdown('factory', 'Factory')}
              </th>
              {/* Customer */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('customer')}>Customer</span>
                  {quotesSortColumn === 'customer' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'customer' ? null : 'customer'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('customer') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'customer' && renderFilterDropdown('customer', 'Customer')}
              </th>
              {/* Job Name */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('jobName')}>Job Name</span>
                  {quotesSortColumn === 'jobName' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'jobName' ? null : 'jobName'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('jobName') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'jobName' && renderFilterDropdown('jobName', 'Job Name')}
              </th>
              {/* Win % */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('winProbability')}>Win %</span>
                  {quotesSortColumn === 'winProbability' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'winProbability' ? null : 'winProbability'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('winProbability') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'winProbability' && renderFilterDropdown('winProbability', 'Win %')}
              </th>
              {/* Approvals */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('approvalStatus')}>Approvals</span>
                  {quotesSortColumn === 'approvalStatus' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'approvalStatus' ? null : 'approvalStatus'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('approvalStatus') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'approvalStatus' && renderFilterDropdown('approvalStatus', 'Approvals')}
              </th>
              {/* End Users */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('endUsers')}>End Users</span>
                  {quotesSortColumn === 'endUsers' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'endUsers' ? null : 'endUsers'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('endUsers') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'endUsers' && renderFilterDropdown('endUsers', 'End Users')}
              </th>
              {/* Inside Reps */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('insideReps')}>Inside Reps</span>
                  {quotesSortColumn === 'insideReps' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'insideReps' ? null : 'insideReps'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('insideReps') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'insideReps' && renderFilterDropdown('insideReps', 'Inside Reps')}
              </th>
              {/* Outside Reps */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('outsideReps')}>Outside Reps</span>
                  {quotesSortColumn === 'outsideReps' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'outsideReps' ? null : 'outsideReps'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('outsideReps') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'outsideReps' && renderFilterDropdown('outsideReps', 'Outside Reps')}
              </th>
              {/* Published */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('published')}>Published</span>
                  {quotesSortColumn === 'published' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'published' ? null : 'published'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('published') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'published' && renderFilterDropdown('published', 'Published')}
              </th>
              {/* Tags */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                <div className="flex items-center gap-1">
                  <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('tags')}>Tags</span>
                  {quotesSortColumn === 'tags' && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveQuoteSortKey(activeQuoteSortKey === 'tags' ? null : 'tags'); setFilterSearchText(''); }}
                    className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('tags') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {activeQuoteSortKey === 'tags' && renderFilterDropdown('tags', 'Tags')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedQuotes.map((quote) => (
              <tr
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                {/* Checkbox */}
                <td className="px-3 py-3 relative group" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className={`rounded border-[var(--border)] accent-[var(--primary)] ${isQuoteLinked(quote) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    checked={selectedQuotesForBulk.has(quote.id)}
                    disabled={isQuoteLinked(quote)}
                    onChange={(e) => {
                      setSelectedQuotesForBulk(prev => {
                        const newSet = new Set(prev);
                        if (e.target.checked) {
                          newSet.add(quote.id);
                        } else {
                          newSet.delete(quote.id);
                        }
                        return newSet;
                      });
                    }}
                  />
                  {isQuoteLinked(quote) && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      {getQuoteLinkedReason(quote)}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </td>
                {/* Preview */}
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuote(quote);
                    }}
                    className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                    title="Quick preview"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </button>
                </td>
                {/* Quote Number */}
                <td className="px-3 py-3">
                  <span className="text-sm font-medium text-[var(--primary)] hover:underline">{quote.id}</span>
                </td>
                {/* Status */}
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    quote.status === 'Open' ? 'bg-green-100 text-green-800' :
                    quote.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                    quote.status === 'Expired' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {quote.status.toUpperCase()}
                  </span>
                </td>
                {/* Stage */}
                <td className="px-3 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    quote.stage === 'Draft' ? 'bg-gray-100 text-gray-800' :
                    quote.stage === 'Review' ? 'bg-blue-100 text-blue-800' :
                    quote.stage === 'Sent' ? 'bg-purple-100 text-purple-800' :
                    quote.stage === 'Negotiating' ? 'bg-yellow-100 text-yellow-800' :
                    quote.stage === 'Won' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quote.stage}
                  </span>
                </td>
                {/* Quote Amount */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)]">{quote.value}</span>
                </td>
                {/* Bill-To */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)] truncate block max-w-[120px]">{quote.billToCustomer}</span>
                </td>
                {/* Entry Date */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)]">{new Date(quote.entryDate).toLocaleDateString()}</span>
                </td>
                {/* Quote Date */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)]">{new Date(quote.quoteDate).toLocaleDateString()}</span>
                </td>
                {/* Exp. Date */}
                <td className="px-3 py-3">
                  <span className={`text-sm ${new Date(quote.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-medium' : 'text-[var(--foreground)]'}`}>
                    {new Date(quote.expirationDate).toLocaleDateString()}
                  </span>
                </td>
                {/* Factory */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {quote.factories.length > 0 && (
                      <>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
                          {quote.factories[0].name.charAt(0)}
                        </div>
                        {quote.factories.length === 1 ? (
                          <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">{quote.factories[0].name}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">{quote.factories.length} Factories</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                {/* Customer */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                      {quote.soldToCustomer.charAt(0)}
                    </div>
                    <span className="text-sm text-[var(--foreground)] truncate max-w-[120px]">{quote.soldToCustomer}</span>
                  </div>
                </td>
                {/* Job Name */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)] truncate block max-w-[150px]">{quote.jobName}</span>
                </td>
                {/* Win % */}
                <td className="px-3 py-3">
                  <WinProbabilityBadge probability={quote.winProbability} approvalStatus={quote.approvalStatus} />
                </td>
                {/* Approvals */}
                <td className="px-3 py-3">
                  <ApprovalStatusBadge status={quote.approvalStatus} count={quote.pendingApprovals} />
                </td>
                {/* End Users */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {quote.endUsers.length > 0 && (
                      <>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                          {quote.endUsers[0].name.charAt(0)}
                        </div>
                        {quote.endUsers.length === 1 ? (
                          <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">{quote.endUsers[0].name}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">{quote.endUsers.length} End Users</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                {/* Inside Reps */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[var(--foreground)]">
                    {quote.insideReps.length > 0 ? quote.insideReps[0].name : '-'}
                  </span>
                </td>
                {/* Outside Reps */}
                <td className="px-3 py-3">
                  {quote.outsideReps.length > 0 ? (
                    quote.outsideReps.length === 1 ? (
                      <span className="text-sm text-[var(--foreground)]">{quote.outsideReps[0].name}</span>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">{quote.outsideReps.length} Reps Listed</span>
                    )
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">-</span>
                  )}
                </td>
                {/* Published */}
                <td className="px-3 py-3 text-center">
                  {quote.published ? (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-500 mx-auto">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">-</span>
                  )}
                </td>
                {/* Tags */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {quote.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
