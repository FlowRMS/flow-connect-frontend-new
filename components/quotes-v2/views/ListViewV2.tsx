'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { QuoteV2, QuotePipelineStage } from '../types';
import { AvatarInline } from '@/components/ui/CreatedByBadge';
import { ColumnFilter } from '@/components/advancedFilters/components/ColumnFilter';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getQuoteFilterOptions } from '../config/filterConfig';
import { QuotesTableSkeleton } from '../components/QuotesTableSkeleton';

interface ListViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
  // Selection props from parent (optional for backward compatibility)
  isItemSelected?: (id: string) => boolean;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: string, checked: boolean) => void;
  // Column filters - now using ActiveFilter[]
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  // Filter options for column filters
  filterOptions?: ReturnType<typeof getQuoteFilterOptions>;
  // Column filters from parent (controlled)
  columnFilters?: Record<string, ActiveFilter[]>;
  // Loading state
  isLoading?: boolean;
  isFetching?: boolean; // For showing skeleton during refetch (sort/filter)
  // Whether there are any active filters (for better empty state messaging)
  hasActiveFilters?: boolean;
  // Column sort props (for backend sorting)
  columnSort?: string | null;
  columnSortDirection?: 'ASC' | 'DESC';
  onColumnSort?: (column: string) => void;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-green-100 text-green-700';
    case 'ORDERED':
      return 'bg-blue-100 text-blue-700';
    case 'EXPIRED':
      return 'bg-yellow-100 text-yellow-700';
    case 'LOST':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getPipelineStageBadgeClass(stage?: QuotePipelineStage): string {
  switch (stage) {
    case 'DISCOVERY':
      return 'bg-gray-100 text-gray-700';
    case 'PROSPECT':
      return 'bg-slate-100 text-slate-700';
    case 'QUALIFICATION':
      return 'bg-blue-100 text-blue-700';
    case 'PROPOSAL':
      return 'bg-purple-100 text-purple-700';
    case 'NEGOTIATION':
      return 'bg-yellow-100 text-yellow-700';
    case 'CLOSED_WON':
      return 'bg-green-100 text-green-700';
    case 'CLOSED_LOST':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// Format pipeline stage for display (e.g., CLOSED_WON -> Closed Won)
function formatPipelineStage(stage?: QuotePipelineStage): string {
  if (!stage) return '-';
  return stage
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function ListViewV2({
  quotes,
  onQuoteClick,
  isItemSelected,
  isAllSelected,
  isPartiallySelected,
  onSelectAll,
  onSelectOne,
  onColumnFiltersChange,
  filterOptions = getQuoteFilterOptions([], []),
  columnFilters: parentColumnFilters,
  isLoading = false,
  isFetching = false,
  hasActiveFilters = false,
  columnSort = null,
  columnSortDirection = 'DESC',
  onColumnSort,
}: ListViewV2Props) {
  // Local selection state (fallback if parent props not provided)
  const [localSelectedQuotes, setLocalSelectedQuotes] = useState<Set<string>>(new Set());
  
  // Column filter state - use parent if provided, otherwise local state
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, ActiveFilter[]>>({});
  const columnFilters = parentColumnFilters !== undefined ? parentColumnFilters : localColumnFilters;
  const setColumnFilters = parentColumnFilters !== undefined 
    ? (filters: Record<string, ActiveFilter[]>) => {
        if (onColumnFiltersChange) {
          onColumnFiltersChange(filters);
        }
      }
    : setLocalColumnFilters;
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  // Map from UI column keys to filter option IDs
  const columnKeyToFilterId: Record<string, string> = {
    quoteNumber: 'quote-number',
    status: 'status',
    pipelineStage: 'pipeline-stage',
    quoteAmount: 'total-amount',
    commission: 'commission',
    entryDate: 'created-date',
    quoteDate: 'quote-date',
    expirationDate: 'expiration-date',
    published: 'published',
  };
  
  // Handle column filter change - now receives ActiveFilter[]
  const handleColumnFilterChange = useCallback((columnKey: string, filters: ActiveFilter[]) => {
    const newFilters = { ...columnFilters };
    // Remove filter if empty array
    if (filters.length === 0) {
      delete newFilters[columnKey];
    } else {
      newFilters[columnKey] = filters;
    }
    
    setColumnFilters(newFilters);
    if (onColumnFiltersChange) {
      onColumnFiltersChange(newFilters);
    }
  }, [columnFilters, onColumnFiltersChange, setColumnFilters]);

  // SortIndicator component (simple arrows, clickable)
  const SortIndicator = ({ column }: { column: string }) => {
    if (!onColumnSort) return null;
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onColumnSort(column);
    };
    
    if (columnSort !== column) {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center justify-center hover:opacity-100 transition-opacity"
        >
          <ArrowUpDown className="w-4 h-4 opacity-50" />
        </button>
      );
    }
    
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        {columnSortDirection === 'ASC' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>
    );
  };

  // Use parent props if available, otherwise use local state
  const checkIsSelected = (id: string) =>
    isItemSelected ? isItemSelected(id) : localSelectedQuotes.has(id);

  const allSelected = isAllSelected !== undefined
    ? isAllSelected
    : (localSelectedQuotes.size === quotes.length && quotes.length > 0);

  const partiallySelected = isPartiallySelected !== undefined
    ? isPartiallySelected
    : (localSelectedQuotes.size > 0 && localSelectedQuotes.size < quotes.length);

  const toggleSelectAll = () => {
    if (onSelectAll) {
      // Use parent handler
      onSelectAll(!allSelected);
    } else {
      // Local fallback
      if (localSelectedQuotes.size === quotes.length) {
        setLocalSelectedQuotes(new Set());
      } else {
        setLocalSelectedQuotes(new Set(quotes.map((q) => q.id)));
      }
    }
  };

  const toggleSelect = (id: string) => {
    if (onSelectOne) {
      // Use parent handler
      onSelectOne(id, !checkIsSelected(id));
    } else {
      // Local fallback
      const newSet = new Set(localSelectedQuotes);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setLocalSelectedQuotes(newSet);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const isExpiringSoon = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 14 && daysUntil > 0;
  };

  
  // Render column filter component
  const renderColumnFilter = (columnKey: string) => {
    const filterId = columnKeyToFilterId[columnKey];
    if (!filterId) return null;
    
    const filterOption = filterOptions.find(f => f.id === filterId);
    if (!filterOption || !filterOption.columnName) return null;
    
    // Ensure type is preserved correctly
    const filterType = filterOption.type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean';
    
    // Get filters for this column (ActiveFilter[])
    const columnFiltersForThisColumn = columnFilters[columnKey] || [];
    
    return (
      <ColumnFilter
        type={filterType}
        columnName={filterOption.columnName}
        value={columnFiltersForThisColumn}
        onChange={(filters) => handleColumnFilterChange(columnKey, filters)}
        options={filterOption.options}
        placeholder={filterOption.type === 'text' || filterOption.type === 'number' 
          ? `Filter ${filterOption.label.toLowerCase()}...` 
          : undefined}
        isOpen={openFilter === columnKey}
        onToggle={() => setOpenFilter(openFilter === columnKey ? null : columnKey)}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <div className="overflow-auto scrollbar-always-visible flex-1">
        <table className="w-full min-w-[1800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 accent-indigo-600"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = partiallySelected;
                  }}
                  onChange={toggleSelectAll}
                />
              </th>
              {/* Preview */}
              <th className="w-10 px-3 py-3 text-center"></th>
              {/* Quote Number */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('quoteNumber')}
                  >
                    Quote Number
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('quoteNumber')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="quoteNumber" />
                    </div>
                  )}
                </div>
              </th>
              {/* Customer Name */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('soldToCustomerName')}
                  >
                    Customer
                  </span>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="soldToCustomerName" />
                    </div>
                  )}
                </div>
              </th>
              {/* Status */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('status')}
                  >
                    Status
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('status')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="status" />
                    </div>
                  )}
                </div>
              </th>
              {/* Pipeline Stage */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('pipelineStage')}
                  >
                    Pipeline Stage
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('pipelineStage')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="pipelineStage" />
                    </div>
                  )}
                </div>
              </th>
              {/* Quote Amount */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('quoteAmount')}
                  >
                    Total
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('quoteAmount')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="quoteAmount" />
                    </div>
                  )}
                </div>
              </th>
              {/* Commission */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('commission')}
                  >
                    Commission
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('commission')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="commission" />
                    </div>
                  )}
                </div>
              </th>
              {/* Entry Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('entryDate')}
                  >
                    Entry Date
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('entryDate')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="entryDate" />
                    </div>
                  )}
                </div>
              </th>
              {/* Quote Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('quoteDate')}
                  >
                    Quote Date
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('quoteDate')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="quoteDate" />
                    </div>
                  )}
                </div>
              </th>
              {/* Exp. Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '110px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('expirationDate')}
                  >
                    Exp. Date
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('expirationDate')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="expirationDate" />
                    </div>
                  )}
                </div>
              </th>
              {/* Created By */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                <span className="whitespace-nowrap">Created By</span>
              </th>
              {/* Published */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '110px' }}>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="cursor-pointer hover:text-gray-700 whitespace-nowrap" 
                    onClick={() => onColumnSort?.('published')}
                  >
                    Published
                  </span>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderColumnFilter('published')}
                  </div>
                  {onColumnSort && (
                    <div className="flex-shrink-0">
                      <SortIndicator column="published" />
                    </div>
                  )}
                </div>
              </th>
              {/* Part Numbers */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Part Numbers
              </th>
              {/* Sales Reps */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sales Reps
              </th>
              {/* Factories */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Factories
              </th>
              {/* End Users */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                End Users
              </th>
              {/* Categories */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categories
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(isLoading || isFetching) ? (
              <QuotesTableSkeleton rowCount={8} />
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg
                      className="w-10 h-10 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {hasActiveFilters ? 'No quotes found for the applied filters' : 'No quotes found'}
                    </p>
                    {hasActiveFilters && (
                      <p className="text-sm text-gray-500">
                        Try adjusting your filters to see more results
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                return (
                <tr
                  key={quote.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onQuoteClick(quote)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 accent-indigo-600"
                      checked={checkIsSelected(quote.id)}
                      onChange={() => toggleSelect(quote.id)}
                    />
                  </td>
                  {/* Preview */}
                  <td className="px-3 py-3 text-center">
                    <button className="p-1 hover:bg-gray-100 rounded" onClick={(e) => { e.stopPropagation(); onQuoteClick(quote); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                    </button>
                  </td>
                  {/* Quote Number */}
                  <td className="px-3 py-3">
                    <span className="text-sm font-medium text-indigo-600 hover:underline">{quote.quoteNumber}</span>
                  </td>
                  {/* Customer Name */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-gray-900 truncate max-w-[200px] block" title={quote.soldToCustomerName || '-'}>
                      {quote.soldToCustomerName || '-'}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  {/* Pipeline Stage */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPipelineStageBadgeClass(quote.pipelineStage)}`}>
                      {formatPipelineStage(quote.pipelineStage)}
                    </span>
                  </td>
                  {/* Quote Amount */}
                  <td className="px-3 py-3 text-sm text-gray-900">
                    ${Number(quote.quoteAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {/* Commission */}
                  <td className="px-3 py-3 text-sm text-green-600 font-medium">
                    ${Number(quote.commission).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {/* Entry Date */}
                  <td className="px-3 py-3 text-sm text-gray-900">{formatDate(quote.entryDate)}</td>
                  {/* Quote Date */}
                  <td className="px-3 py-3 text-sm text-gray-900">{formatDate(quote.quoteDate)}</td>
                  {/* Exp. Date */}
                  <td className="px-3 py-3">
                    <span className={`text-sm ${isExpiringSoon(quote.expirationDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(quote.expirationDate)}
                    </span>
                  </td>
                  {/* Created By */}
                  <td className="px-3 py-3">
                    <AvatarInline name={quote.createdByName} size="sm" />
                  </td>
                  {/* Published */}
                  <td className="px-3 py-3 text-center">
                    {quote.published ? (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-500 mx-auto">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-gray-300 mx-auto">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </td>
                  {/* Part Numbers */}
                  <td className="px-3 py-3">
                    {quote.partNumbers && quote.partNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {quote.partNumbers.slice(0, 3).map((pn, idx) => (
                          <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 truncate max-w-[80px]" title={pn}>
                            {pn}
                          </span>
                        ))}
                        {quote.partNumbers.length > 3 && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                            +{quote.partNumbers.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  {/* Sales Reps */}
                  <td className="px-3 py-3">
                    {quote.salesReps && quote.salesReps.length > 0 ? (
                      <div className="space-y-1 max-w-[250px]">
                        {quote.salesReps.slice(0, 2).map((rep, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-900 truncate max-w-[100px]" title={rep.fullName || 'Unknown'}>
                              {rep.fullName || 'Unknown'}
                            </span>
                            {rep.avgSplitRate !== undefined && (
                              <span className="text-blue-600 whitespace-nowrap">
                                {rep.avgSplitRate}%
                              </span>
                            )}
                            {rep.total !== undefined && (
                              <span className="text-green-600 whitespace-nowrap">
                                ${Number(rep.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        ))}
                        {quote.salesReps.length > 2 && (
                          <span className="text-xs text-gray-500">+{quote.salesReps.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  {/* Factories */}
                  <td className="px-3 py-3">
                    {quote.factories && quote.factories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {quote.factories.slice(0, 2).map((factory, idx) => (
                          <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 truncate max-w-[80px]" title={factory}>
                            {factory}
                          </span>
                        ))}
                        {quote.factories.length > 2 && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-purple-200 text-purple-600">
                            +{quote.factories.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  {/* End Users */}
                  <td className="px-3 py-3">
                    {quote.endUsers && quote.endUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {quote.endUsers.slice(0, 2).map((endUser, idx) => (
                          <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 truncate max-w-[80px]" title={endUser}>
                            {endUser}
                          </span>
                        ))}
                        {quote.endUsers.length > 2 && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-orange-200 text-orange-600">
                            +{quote.endUsers.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  {/* Categories */}
                  <td className="px-3 py-3">
                    {quote.categories && quote.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {quote.categories.slice(0, 2).map((category, idx) => (
                          <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-700 truncate max-w-[80px]" title={category}>
                            {category}
                          </span>
                        ))}
                        {quote.categories.length > 2 && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-teal-200 text-teal-600">
                            +{quote.categories.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
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

export default ListViewV2;
