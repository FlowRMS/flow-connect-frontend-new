'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Quote, QuoteStatus, QuotePipelineStage } from '../api';
import { WinProbabilityBadge, ApprovalStatusBadge } from '../components';

// ============================================================================
// Types
// ============================================================================

export type QuoteSortKey =
  | 'id'
  | 'quoteNumber'
  | 'status'
  | 'total'
  | 'entityDate'
  | 'quoteDate'
  | 'expDate'
  | 'factory'
  | 'soldTo'
  | 'job'
  | 'endUsers'
  | 'insideReps'
  | 'outsideReps'
  | 'published'
  | 'pipelineStage'
  | 'billTo'
  | 'winProbability'
  | 'approval'
  | 'tags';

export interface QuoteFilterValue {
  type: 'text' | 'select' | 'multiselect' | 'daterange';
  value?: string;
  values?: string[];
  startDate?: string;
  endDate?: string;
}

export interface ListViewProps {
  quotes: Quote[];
  sortColumn: QuoteSortKey | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: QuoteSortKey) => void;
  onQuoteSelect: (quote: Quote) => void;
  selectedQuotes: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  columnFilters: Record<QuoteSortKey, QuoteFilterValue | null>;
  activeFilterColumn: QuoteSortKey | null;
  onFilterColumnChange: (column: QuoteSortKey | null) => void;
  onFilterChange: (column: QuoteSortKey, filter: QuoteFilterValue | null) => void;
  onClearFilter: (column: QuoteSortKey) => void;
  hasActiveFilter: (column: QuoteSortKey) => boolean;
  getUniqueValuesForColumn: (column: QuoteSortKey) => string[];
  getFilterType: (column: QuoteSortKey) => 'text' | 'select' | 'multiselect' | 'daterange';
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
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps {
  column: QuoteSortKey;
  label: string;
  filterType: 'text' | 'select' | 'multiselect' | 'daterange';
  filterValue: QuoteFilterValue | null;
  onFilterChange: (column: QuoteSortKey, filter: QuoteFilterValue | null) => void;
  onClearFilter: (column: QuoteSortKey) => void;
  options: string[];
  onClose: () => void;
}

function FilterDropdown({
  column,
  label,
  filterType,
  filterValue,
  onFilterChange,
  onClearFilter,
  options,
  onClose,
}: FilterDropdownProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(filterValue?.values || (filterValue?.value ? [filterValue.value] : []))
  );
  const [startDate, setStartDate] = useState(filterValue?.startDate || '');
  const [endDate, setEndDate] = useState(filterValue?.endDate || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTextFilter = (value: string) => {
    if (value) {
      onFilterChange(column, { type: 'text', value });
    } else {
      onClearFilter(column);
    }
  };

  const handleSelectFilter = (value: string) => {
    if (value) {
      onFilterChange(column, { type: 'select', value });
    } else {
      onClearFilter(column);
    }
    onClose();
  };

  const handleMultiselectToggle = (value: string) => {
    const newSelected = new Set(selectedValues);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelectedValues(newSelected);
  };

  const applyMultiselect = () => {
    if (selectedValues.size > 0) {
      onFilterChange(column, { type: 'multiselect', values: Array.from(selectedValues) });
    } else {
      onClearFilter(column);
    }
    onClose();
  };

  const handleDateRangeApply = () => {
    if (startDate || endDate) {
      onFilterChange(column, { type: 'daterange', startDate, endDate });
    } else {
      onClearFilter(column);
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[200px]"
    >
      {filterType === 'text' && (
        <div className="p-2">
          <input
            type="text"
            placeholder={`Filter ${label.toLowerCase()}...`}
            value={filterValue?.value || ''}
            onChange={(e) => handleTextFilter(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            autoFocus
          />
          {filterValue?.value && (
            <button
              onClick={() => onClearFilter(column)}
              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {filterType === 'select' && (
        <div className="p-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
            autoFocus
          />
          <div className="max-h-[200px] overflow-y-auto">
            <button
              onClick={() => handleSelectFilter('')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${!filterValue?.value ? 'bg-[var(--muted)] font-medium' : ''}`}
            >
              All
            </button>
            {filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectFilter(option)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${filterValue?.value === option ? 'bg-[var(--muted)] font-medium' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {filterType === 'multiselect' && (
        <div className="p-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
            autoFocus
          />
          <div className="max-h-[200px] overflow-y-auto mb-2">
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.has(option)}
                  onChange={() => handleMultiselectToggle(option)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                {option}
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setSelectedValues(new Set());
                onClearFilter(column);
                onClose();
              }}
              className="flex-1 px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)]"
            >
              Clear
            </button>
            <button
              onClick={applyMultiselect}
              className="flex-1 px-2 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)]"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {filterType === 'daterange' && (
        <div className="p-2">
          <div className="space-y-2 mb-2">
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                onClearFilter(column);
                onClose();
              }}
              className="flex-1 px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)]"
            >
              Clear
            </button>
            <button
              onClick={handleDateRangeApply}
              className="flex-1 px-2 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Bulk Actions Menu Component
// ============================================================================

interface BulkActionsMenuProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: (status: QuoteStatus) => void;
}

function BulkActionsMenu({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkStatusChange,
}: BulkActionsMenuProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--primary)]/10 border-b border-[var(--border)]">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {selectedCount} quote{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        {onBulkStatusChange && (
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] hover:bg-[var(--muted)] transition-colors flex items-center gap-1"
            >
              Change Status
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[140px]">
                {(['OPEN', 'ORDERED', 'EXPIRED', 'LOST'] as QuoteStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onBulkStatusChange(status);
                      setShowStatusMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    {formatStatus(status)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onBulkExport && (
          <button
            onClick={onBulkExport}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] hover:bg-[var(--muted)] transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        )}
        {onBulkDelete && (
          <button
            onClick={onBulkDelete}
            className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete
          </button>
        )}
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main ListView Component
// ============================================================================

export function ListView({
  quotes,
  sortColumn,
  sortDirection,
  onSort,
  onQuoteSelect,
  selectedQuotes,
  onSelectionChange,
  columnFilters,
  activeFilterColumn,
  onFilterColumnChange,
  onFilterChange,
  onClearFilter,
  hasActiveFilter,
  getUniqueValuesForColumn,
  getFilterType,
}: ListViewProps) {
  const [filterSearchText, setFilterSearchText] = useState('');

  // Toggle row selection
  const toggleSelection = (quoteId: string) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    onSelectionChange(newSelected);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedQuotes.size === quotes.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(quotes.map((q) => q.id)));
    }
  };

  // Render sortable/filterable header cell
  const renderHeaderCell = (
    column: QuoteSortKey,
    label: string,
    sortable = true,
    filterable = true,
    textAlign: 'left' | 'center' | 'right' = 'left'
  ) => {
    const isSorted = sortColumn === column;
    const isActiveFilter = activeFilterColumn === column;
    const hasFilter = hasActiveFilter(column);
    const justifyClass = textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : '';

    return (
      <th className={`px-3 py-3 ${textAlign === 'right' ? 'text-right' : textAlign === 'center' ? 'text-center' : 'text-left'}`}>
        <div className={`relative flex items-center gap-1 ${justifyClass}`}>
          {sortable ? (
            <button
              onClick={() => onSort(column)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
            >
              {label}
              <span className="flex flex-col">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  className={`${isSorted && sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
                >
                  <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
                </svg>
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  className={`-mt-0.5 ${isSorted && sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
                >
                  <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
                </svg>
              </span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {label}
            </span>
          )}
          {filterable && (
            <button
              onClick={() => onFilterColumnChange(isActiveFilter ? null : column)}
              className={`p-0.5 rounded hover:bg-[var(--muted)] transition-colors ${hasFilter ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/60'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          )}
          {isActiveFilter && (
            <FilterDropdown
              column={column}
              label={label}
              filterType={getFilterType(column)}
              filterValue={columnFilters[column]}
              onFilterChange={onFilterChange}
              onClearFilter={onClearFilter}
              options={getUniqueValuesForColumn(column)}
              onClose={() => onFilterColumnChange(null)}
            />
          )}
        </div>
      </th>
    );
  };

  // Get mock win probability and approval data (in real app would come from quote)
  const getWinProbability = (quote: Quote) => {
    // Mock based on pipeline stage and status
    if (quote.status === 'ORDERED') return 100;
    if (quote.status === 'LOST') return 0;
    if (quote.status === 'EXPIRED') return 10;
    switch (quote.pipelineStage) {
      case 'CLOSED_WON': return 100;
      case 'CLOSED_LOST': return 0;
      case 'NEGOTIATION': return 75;
      case 'PROPOSAL': return 60;
      case 'QUALIFICATION': return 45;
      case 'PROSPECT': return 30;
      case 'DISCOVERY': return 20;
      default: return 50;
    }
  };

  const getApprovalStatus = (quote: Quote): { status: 'clear' | 'pending' | 'blocked'; count: number } => {
    // Mock approval status - in real app would come from quote details
    const hasApprovalNeeded = quote.details?.some((d) => d.factoryId);
    if (!hasApprovalNeeded) return { status: 'clear', count: 0 };
    // Random for demo
    const rand = Math.random();
    if (rand > 0.7) return { status: 'blocked', count: 1 };
    if (rand > 0.4) return { status: 'pending', count: 2 };
    return { status: 'clear', count: 0 };
  };

  return (
    <div className="flex flex-col">
      {/* Bulk Actions Menu */}
      <BulkActionsMenu
        selectedCount={selectedQuotes.size}
        onClearSelection={() => onSelectionChange(new Set())}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
            <tr>
              {/* Checkbox column */}
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={quotes.length > 0 && selectedQuotes.size === quotes.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </th>
              {renderHeaderCell('quoteNumber', 'Quote #')}
              {renderHeaderCell('status', 'Status')}
              {renderHeaderCell('total', 'Value', true, false, 'right')}
              {renderHeaderCell('entityDate', 'Entry Date')}
              {renderHeaderCell('quoteDate', 'Quote Date')}
              {renderHeaderCell('expDate', 'Exp Date')}
              {renderHeaderCell('factory', 'Factory')}
              {renderHeaderCell('soldTo', 'Sold To')}
              {renderHeaderCell('job', 'Job')}
              {renderHeaderCell('endUsers', 'End Users')}
              {renderHeaderCell('insideReps', 'Inside Reps')}
              {renderHeaderCell('outsideReps', 'Outside Reps')}
              {renderHeaderCell('published', 'Published', true, true, 'center')}
              {renderHeaderCell('pipelineStage', 'Stage')}
              {renderHeaderCell('billTo', 'Bill To')}
              {renderHeaderCell('winProbability', 'Win %', true, false, 'center')}
              {renderHeaderCell('approval', 'Approval', true, false, 'center')}
              {renderHeaderCell('tags', 'Tags', false, true)}
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={19} className="px-4 py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No quotes found</h3>
                  <p className="text-[var(--muted-foreground)]">
                    Try adjusting your search or filters
                  </p>
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const winProb = getWinProbability(quote);
                const approvalInfo = getApprovalStatus(quote);
                const isSelected = selectedQuotes.has(quote.id);

                return (
                  <tr
                    key={quote.id}
                    onClick={() => onQuoteSelect(quote)}
                    className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/30 cursor-pointer transition-colors ${isSelected ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(quote.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </td>
                    {/* Quote # */}
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                        {quote.quoteNumber}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status as QuoteStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {formatStatus(quote.status)}
                      </span>
                    </td>
                    {/* Value */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-medium text-[var(--foreground)]">
                        {formatCurrency(quote.balance?.total)}
                      </span>
                    </td>
                    {/* Entry Date */}
                    <td className="px-3 py-3">
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {formatDate(quote.createdAt)}
                      </span>
                    </td>
                    {/* Quote Date */}
                    <td className="px-3 py-3">
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {formatDate(quote.entityDate)}
                      </span>
                    </td>
                    {/* Exp Date */}
                    <td className="px-3 py-3">
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {formatDate(quote.expDate)}
                      </span>
                    </td>
                    {/* Factory */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {quote.details?.[0]?.factoryId ? 'Factory' : '—'}
                      </span>
                    </td>
                    {/* Sold To */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {quote.soldToCustomer?.companyName || '—'}
                      </span>
                    </td>
                    {/* Job */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {quote.customerRef || '—'}
                      </span>
                    </td>
                    {/* End Users */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {quote.details?.filter(d => d.endUserId).length || 0}
                      </span>
                    </td>
                    {/* Inside Reps */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {quote.insideReps?.length || 0}
                      </span>
                    </td>
                    {/* Outside Reps */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {quote.details?.reduce((acc, d) => acc + (d.splitRates?.length || 0), 0) || 0}
                      </span>
                    </td>
                    {/* Published */}
                    <td className="px-3 py-3 text-center">
                      {quote.published ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-400 rounded-full">
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </span>
                      )}
                    </td>
                    {/* Stage */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pipelineStageColors[quote.pipelineStage as QuotePipelineStage] || 'bg-gray-100 text-gray-700'}`}>
                        {formatPipelineStage(quote.pipelineStage)}
                      </span>
                    </td>
                    {/* Bill To */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {quote.billToCustomer?.companyName || '—'}
                      </span>
                    </td>
                    {/* Win % */}
                    <td className="px-3 py-3 text-center">
                      <WinProbabilityBadge
                        probability={winProb}
                        approvalStatus={approvalInfo.status}
                      />
                    </td>
                    {/* Approval */}
                    <td className="px-3 py-3 text-center">
                      <ApprovalStatusBadge
                        status={approvalInfo.status}
                        count={approvalInfo.count}
                      />
                    </td>
                    {/* Tags */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">—</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListView;
