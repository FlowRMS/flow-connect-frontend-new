'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleQuotesState } from './hooks/useSimpleQuotesState';
import { DeleteQuoteModal } from './modals/DeleteQuoteModal';
import type { QuoteLandingPage, QuoteStatus, QuotePipelineStage } from './api';

// ============================================================================
// Types
// ============================================================================

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string;
  direction: SortDirection;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

// Status colors
const statusColors: Record<QuoteStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  ORDERED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  LOST: 'bg-red-100 text-red-700',
};

// Pipeline stage colors
const pipelineStageColors: Record<QuotePipelineStage, string> = {
  DISCOVERY: 'bg-purple-100 text-purple-700',
  PROSPECT: 'bg-indigo-100 text-indigo-700',
  QUALIFICATION: 'bg-cyan-100 text-cyan-700',
  PROPOSAL: 'bg-amber-100 text-amber-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
};

// Format status for display
const formatStatus = (status?: QuoteStatus) => {
  if (!status) return '—';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

// Format pipeline stage for display
const formatPipelineStage = (stage?: QuotePipelineStage) => {
  if (!stage) return '—';
  return stage.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

// ============================================================================
// Column Header Component
// ============================================================================

interface ColumnHeaderProps {
  label: string;
  columnKey: string;
  sortState: SortState | null;
  onSort: (column: string) => void;
  filterType: 'text' | 'dropdown';
  filterValue: string;
  onFilterChange: (column: string, value: string) => void;
  filterOptions?: string[];
  textAlign?: 'left' | 'center' | 'right';
}

function ColumnHeader({
  label,
  columnKey,
  sortState,
  onSort,
  filterType,
  filterValue,
  onFilterChange,
  filterOptions = [],
  textAlign = 'left',
}: ColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSorted = sortState?.column === columnKey;
  const sortDirection = isSorted ? sortState.direction : null;

  const filteredOptions = filterOptions.filter((opt) =>
    opt.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  const justifyClass = textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : '';

  return (
    <div className="relative" ref={filterRef}>
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        <button
          onClick={() => onSort(columnKey)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
        >
          {label}
          <span className="flex flex-col">
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`${sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`-mt-0.5 ${sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
            </svg>
          </span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] transition-colors ${filterValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/60'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {showFilter && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          {filterType === 'text' ? (
            <div className="p-2">
              <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange(columnKey, '');
                    setShowFilter(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${!filterValue ? 'bg-[var(--muted)] font-medium' : ''}`}
                >
                  All
                </button>
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onFilterChange(columnKey, option);
                      setShowFilter(false);
                      setDropdownSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${filterValue === option ? 'bg-[var(--muted)] font-medium' : ''}`}
                  >
                    {formatPipelineStage(option as QuotePipelineStage)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SimpleQuotesContent() {
  const router = useRouter();
  const {
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
  } = useSimpleQuotesState();

  // Quote to delete
  const quoteToDelete = useMemo(() => {
    if (!deleteConfirmId) return null;
    return filteredQuotes.find((q) => q.id === deleteConfirmId) || null;
  }, [deleteConfirmId, filteredQuotes]);

  // Navigate to quote detail page
  const handleQuoteClick = (quote: QuoteLandingPage) => {
    router.push(`/quotes/${quote.id}/edit`);
  };

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Skeleton loader
  if (!isMounted) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--muted)] rounded w-48" />
            <div className="h-4 bg-[var(--muted)] rounded w-64" />
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-[var(--muted)] rounded-lg" />
              ))}
            </div>
            <div className="h-10 bg-[var(--muted)] rounded mt-6" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-[var(--muted)] rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotes</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage your quotes and proposals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/quotes/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                </svg>
                Create Quote
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Quotes</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{totalCount}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">In system</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Open</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.openQuotes}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Pending action</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Ordered</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{stats.orderedQuotes}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Converted</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Lost</div>
              <div className="text-2xl font-semibold text-red-600 mt-1">{stats.lostQuotes}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Declined</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Expired</div>
              <div className="text-2xl font-semibold text-gray-500 mt-1">{stats.expiredQuotes}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Past due</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
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
                placeholder="Search by quote number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Results count */}
          <div className="text-sm text-[var(--muted-foreground)] mb-4">
            Showing {filteredQuotes.length} of {totalCount} quotes
          </div>
        </div>

        {/* Quotes Table */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {isLoading && filteredQuotes.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-4 text-[var(--muted-foreground)]">Loading quotes...</p>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No quotes found</h3>
                <p className="text-[var(--muted-foreground)] mb-4">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Get started by creating your first quote'}
                </p>
                <button
                  onClick={() => router.push('/quotes/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                  </svg>
                  Create Quote
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left px-4 py-3">
                      <ColumnHeader
                        label="Quote #"
                        columnKey="quoteNumber"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="text"
                        filterValue={columnFilters.quoteNumber}
                        onFilterChange={handleColumnFilterChange}
                      />
                    </th>
                    <th className="text-left px-4 py-3">
                      <ColumnHeader
                        label="Status"
                        columnKey="status"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="dropdown"
                        filterValue={columnFilters.status}
                        onFilterChange={handleColumnFilterChange}
                        filterOptions={uniqueStatuses}
                      />
                    </th>
                    <th className="text-left px-4 py-3">
                      <ColumnHeader
                        label="Stage"
                        columnKey="pipelineStage"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="dropdown"
                        filterValue={columnFilters.pipelineStage}
                        onFilterChange={handleColumnFilterChange}
                        filterOptions={uniquePipelineStages}
                      />
                    </th>
                    <th className="text-right px-4 py-3">
                      <ColumnHeader
                        label="Total"
                        columnKey="total"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="text"
                        filterValue=""
                        onFilterChange={() => {}}
                        textAlign="right"
                      />
                    </th>
                    <th className="text-left px-4 py-3">
                      <ColumnHeader
                        label="Quote Date"
                        columnKey="entityDate"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="text"
                        filterValue=""
                        onFilterChange={() => {}}
                      />
                    </th>
                    <th className="text-left px-4 py-3">
                      <ColumnHeader
                        label="Exp. Date"
                        columnKey="expDate"
                        sortState={sortState}
                        onSort={handleSort}
                        filterType="text"
                        filterValue=""
                        onFilterChange={() => {}}
                      />
                    </th>
                    <th className="text-center px-4 py-3">
                      <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => handleQuoteClick(quote)}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--foreground)]">{quote.quoteNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status as QuoteStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {formatStatus(quote.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pipelineStageColors[quote.pipelineStage as QuotePipelineStage] || 'bg-gray-100 text-gray-700'}`}>
                          {formatPipelineStage(quote.pipelineStage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-[var(--foreground)]">{formatCurrency(quote.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[var(--muted-foreground)]">{formatDate(quote.entityDate)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[var(--muted-foreground)]">{formatDate(quote.expDate)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/quotes/${quote.id}/edit`);
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                            title="Edit quote"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(quote.id);
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete quote"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-10" />

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="p-4 text-center">
                <svg className="animate-spin h-6 w-6 mx-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {quoteToDelete && (
        <DeleteQuoteModal
          quote={quoteToDelete}
          onClose={() => setDeleteConfirmId(null)}
          onDeleted={handleQuoteDeleted}
        />
      )}
    </main>
  );
}
