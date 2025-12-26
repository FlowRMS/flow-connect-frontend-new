'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// Types - Import from local types module (mock data types)
// ============================================================================
import type { Quote, QuoteSortKey } from './types';

// ============================================================================
// Data - Mock data for development
// ============================================================================
// mockQuotes is imported via useQuotesState hook

// ============================================================================
// Config - Stage definitions, colors, and constants
// ============================================================================
// stages and lostReasonOptions are available from './config' if needed

// ============================================================================
// Hooks - State management hooks
// ============================================================================
import { useQuotesState } from './hooks';

// ============================================================================
// Components - Reusable UI components
// ============================================================================
// Components like WinProbabilityBadge and ApprovalStatusBadge are used
// within the views (KanbanView, ListView)

// ============================================================================
// Modals - Modal dialog components
// ============================================================================
import { DeleteQuoteModal } from './modals';

// ============================================================================
// Views - Main view components
// ============================================================================
import { KanbanView, QuoteDetailPanel } from './views';

// ============================================================================
// Local Types
// ============================================================================
type ViewMode = 'kanban' | 'list';

// ============================================================================
// QuotesToolbar Component
// ============================================================================
interface QuotesToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateQuote: () => void;
  quickDatePreset: string;
  onQuickDatePresetChange: (preset: 'all' | 'today' | 'this_week' | 'last_week') => void;
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

function QuotesToolbar({
  viewMode,
  onViewModeChange,
  onCreateQuote,
  quickDatePreset,
  onQuickDatePresetChange,
  selectedCount,
  onBulkAction,
}: QuotesToolbarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and bulk actions */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotes</h1>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">
                {selectedCount} selected
              </span>
              <button
                onClick={() => onBulkAction('export')}
                className="px-2 py-1 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => onBulkAction('delete')}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Date Filter */}
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            {(['all', 'today', 'this_week', 'last_week'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => onQuickDatePresetChange(preset)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  quickDatePreset === preset
                    ? 'bg-[var(--primary)] text-white'
                    : 'hover:bg-[var(--muted)]'
                }`}
              >
                {preset === 'all' ? 'All' : preset === 'today' ? 'Today' : preset === 'this_week' ? 'This Week' : 'Last Week'}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--primary)] text-white'
                  : 'hover:bg-[var(--muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="12" rx="1" />
              </svg>
              Kanban
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white'
                  : 'hover:bg-[var(--muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
          </div>

          {/* Create Quote Button */}
          <button
            onClick={onCreateQuote}
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
    </div>
  );
}

// ============================================================================
// MarkAsLostModal Component
// ============================================================================
interface MarkAsLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  lostReasons: string[];
}

function MarkAsLostModal({ isOpen, onClose, onConfirm, lostReasons }: MarkAsLostModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (reason) {
      onConfirm(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Mark Quote as Lost</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Please select a reason for marking this quote as lost:
        </p>

        <div className="space-y-2 mb-4">
          {lostReasons.map((reason) => (
            <label key={reason} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lostReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-4 h-4 text-[var(--primary)]"
              />
              <span className="text-sm">{reason}</span>
            </label>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Enter custom reason..."
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            rows={3}
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QuotesStats Component
// ============================================================================
interface QuotesStatsProps {
  quotes: Quote[];
}

function QuotesStats({ quotes }: QuotesStatsProps) {
  const stats = useMemo(() => {
    const totalValue = quotes.reduce((sum, q) => sum + q.valueNumber, 0);
    const openQuotes = quotes.filter((q) => q.status === 'Open').length;
    const wonQuotes = quotes.filter((q) => q.stage === 'Won').length;
    const lostQuotes = quotes.filter((q) => q.stage === 'Lost').length;
    const avgWinProbability = quotes.length > 0
      ? quotes.reduce((sum, q) => sum + q.winProbability, 0) / quotes.length
      : 0;

    return { totalValue, openQuotes, wonQuotes, lostQuotes, avgWinProbability };
  }, [quotes]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
      <div className="flex flex-col">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Total Pipeline</span>
        <span className="text-xl font-semibold text-[var(--foreground)]">{formatCurrency(stats.totalValue)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Open Quotes</span>
        <span className="text-xl font-semibold text-blue-600">{stats.openQuotes}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Won</span>
        <span className="text-xl font-semibold text-green-600">{stats.wonQuotes}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Lost</span>
        <span className="text-xl font-semibold text-red-600">{stats.lostQuotes}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Avg Win %</span>
        <span className="text-xl font-semibold text-[var(--foreground)]">{stats.avgWinProbability.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ============================================================================
// QuotesListView Component (Simplified list view for mock data)
// ============================================================================
interface QuotesListViewProps {
  quotes: Quote[];
  onQuoteSelect: (quote: Quote) => void;
  sortColumn: QuoteSortKey | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: QuoteSortKey) => void;
}

function QuotesListView({ quotes, onQuoteSelect, sortColumn, sortDirection, onSort }: QuotesListViewProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      Review: 'bg-blue-100 text-blue-700',
      Sent: 'bg-purple-100 text-purple-700',
      Negotiating: 'bg-yellow-100 text-yellow-700',
      Won: 'bg-green-100 text-green-700',
      Lost: 'bg-red-100 text-red-700',
      Dormant: 'bg-gray-100 text-gray-500',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const renderSortIcon = (column: QuoteSortKey) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? ' ^' : ' v';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('id')}>
              Quote #{renderSortIcon('id')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('stage')}>
              Stage{renderSortIcon('stage')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('soldToCustomer')}>
              Customer{renderSortIcon('soldToCustomer')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('jobName')}>
              Job{renderSortIcon('jobName')}
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('valueNumber')}>
              Value{renderSortIcon('valueNumber')}
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('winProbability')}>
              Win %{renderSortIcon('winProbability')}
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer" onClick={() => onSort('entryDate')}>
              Entry Date{renderSortIcon('entryDate')}
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                No quotes found
              </td>
            </tr>
          ) : (
            quotes.map((quote) => (
              <tr
                key={quote.id}
                onClick={() => onQuoteSelect(quote)}
                className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium">{quote.id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(quote.stage)}`}>
                    {quote.stage}
                  </span>
                </td>
                <td className="px-4 py-3">{quote.soldToCustomer}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{quote.jobName}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(quote.valueNumber)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${quote.winProbability >= 70 ? 'text-green-600' : quote.winProbability >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {quote.winProbability}%
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{quote.entryDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main QuotesContent Component
// ============================================================================
export default function QuotesContentRefactored() {
  const router = useRouter();

  // ============================================
  // USE QUOTES STATE HOOK
  // ============================================
  const {
    // Main quotes state
    quotes,
    setQuotes,
    viewMode,
    setViewMode,
    selectedQuote,
    setSelectedQuote,

    // Sorting state and handlers
    quotesSortColumn,
    quotesSortDirection,
    handleQuotesSort,

    // Quick date filter state
    quickDatePreset,
    setQuickDatePreset,

    // Bulk selection state
    selectedQuotesForBulk,
    setSelectedQuotesForBulk,

    // Mark as lost modal state
    showMarkAsLostModal,
    setShowMarkAsLostModal,
    lostReasons,

    // Computed/memoized values
    sortedQuotes,
  } = useQuotesState();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const quoteToDelete = useMemo(() => {
    if (!deleteQuoteId) return null;
    return quotes.find((q) => q.id === deleteQuoteId) || null;
  }, [deleteQuoteId, quotes]);

  // ============================================
  // HANDLERS
  // ============================================

  // Handle quote selection (for detail view)
  const handleQuoteSelect = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
  }, [setSelectedQuote]);

  // Handle quote update from detail panel
  const handleQuoteUpdate = useCallback((updates: Partial<Quote>) => {
    if (selectedQuote) {
      setQuotes((prev) =>
        prev.map((q) => (q.id === selectedQuote.id ? { ...q, ...updates } : q))
      );
      setSelectedQuote((prev) => (prev ? { ...prev, ...updates } : null));
    }
  }, [selectedQuote, setQuotes, setSelectedQuote]);

  // Handle back from detail panel
  const handleBackFromDetail = useCallback(() => {
    setSelectedQuote(null);
  }, [setSelectedQuote]);

  // Handle create quote navigation
  const handleCreateQuote = useCallback(() => {
    router.push('/quotes/new');
  }, [router]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string) => {
    if (action === 'delete') {
      // Handle bulk delete
      console.log('Bulk delete:', Array.from(selectedQuotesForBulk));
    } else if (action === 'export') {
      // Handle bulk export
      console.log('Bulk export:', Array.from(selectedQuotesForBulk));
    }
    setSelectedQuotesForBulk(new Set());
  }, [selectedQuotesForBulk, setSelectedQuotesForBulk]);

  // Handle quote deletion
  const handleQuoteDeleted = useCallback((quoteId: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    setDeleteQuoteId(null);
  }, [setQuotes]);

  // Handle mark as lost confirmation
  const handleMarkAsLostConfirm = useCallback((reason: string) => {
    // Mark selected quotes as lost
    setQuotes((prev) =>
      prev.map((q) =>
        selectedQuotesForBulk.has(q.id)
          ? { ...q, stage: 'Lost' as const, lostReason: reason }
          : q
      )
    );
    setShowMarkAsLostModal(false);
    setSelectedQuotesForBulk(new Set());
  }, [selectedQuotesForBulk, setQuotes, setShowMarkAsLostModal, setSelectedQuotesForBulk]);

  // Handle selection change for list view
  const handleSelectionChange = useCallback((selected: Set<string>) => {
    setSelectedQuotesForBulk(selected);
  }, [setSelectedQuotesForBulk]);

  // ============================================
  // RENDER - DETAIL PANEL VIEW
  // ============================================
  if (selectedQuote) {
    return (
      <QuoteDetailPanel
        quote={selectedQuote}
        onBack={handleBackFromDetail}
        onQuoteUpdate={handleQuoteUpdate}
      />
    );
  }

  // ============================================
  // RENDER - LIST/KANBAN VIEW
  // ============================================
  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Toolbar */}
      <QuotesToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateQuote={handleCreateQuote}
        quickDatePreset={quickDatePreset}
        onQuickDatePresetChange={setQuickDatePreset}
        selectedCount={selectedQuotesForBulk.size}
        onBulkAction={handleBulkAction}
      />

      {/* Stats Bar */}
      <QuotesStats quotes={sortedQuotes} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' ? (
          <KanbanView
            quotes={sortedQuotes}
            onQuoteSelect={handleQuoteSelect}
          />
        ) : (
          <QuotesListView
            quotes={sortedQuotes}
            sortColumn={quotesSortColumn}
            sortDirection={quotesSortDirection}
            onSort={handleQuotesSort}
            onQuoteSelect={handleQuoteSelect}
          />
        )}
      </div>

      {/* Modals */}
      {quoteToDelete && (
        <DeleteQuoteModal
          quote={quoteToDelete}
          onClose={() => setDeleteQuoteId(null)}
          onDeleted={() => handleQuoteDeleted(quoteToDelete.id)}
        />
      )}

      <MarkAsLostModal
        isOpen={showMarkAsLostModal}
        onClose={() => setShowMarkAsLostModal(false)}
        onConfirm={handleMarkAsLostConfirm}
        lostReasons={lostReasons}
      />

      {/* SubmittalConfigModal and RepSplitModal require additional context
          (submittal object, line item) that would come from QuoteDetailPanel */}
    </main>
  );
}
