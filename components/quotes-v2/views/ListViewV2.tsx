'use client';

import React, { useState, useMemo } from 'react';
import type { QuoteV2, QuotePipelineStage } from '../types';

interface ListViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
}

type SortKey = 'quoteNumber' | 'status' | 'pipelineStage' | 'quoteAmount' | 'entryDate' | 'quoteDate' | 'expirationDate' | 'published';

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

export function ListViewV2({ quotes, onQuoteClick }: ListViewV2Props) {
  const [sortColumn, setSortColumn] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedQuotes = useMemo(() => {
    if (!sortColumn) return quotes;

    return [...quotes].sort((a, b) => {
      let aVal: string | number | boolean | undefined = '';
      let bVal: string | number | boolean | undefined = '';

      switch (sortColumn) {
        case 'quoteNumber':
          aVal = a.quoteNumber;
          bVal = b.quoteNumber;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'pipelineStage':
          aVal = a.pipelineStage || '';
          bVal = b.pipelineStage || '';
          break;
        case 'quoteAmount':
          aVal = a.quoteAmount;
          bVal = b.quoteAmount;
          break;
        case 'entryDate':
          aVal = a.entryDate;
          bVal = b.entryDate;
          break;
        case 'quoteDate':
          aVal = a.quoteDate;
          bVal = b.quoteDate;
          break;
        case 'expirationDate':
          aVal = a.expirationDate;
          bVal = b.expirationDate;
          break;
        case 'published':
          aVal = a.published ? 1 : 0;
          bVal = b.published ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [quotes, sortColumn, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedQuotes.size === quotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(quotes.map((q) => q.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedQuotes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQuotes(newSet);
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

  const renderSortIcon = (column: SortKey) => {
    if (sortColumn !== column) return null;
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const renderFilterIcon = () => (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5 text-gray-400">
      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 accent-indigo-600"
                  checked={selectedQuotes.size === quotes.length && quotes.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              {/* Preview */}
              <th className="w-10 px-3 py-3 text-center"></th>
              {/* Quote Number */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('quoteNumber')}>
                  Quote Number {renderFilterIcon()} {renderSortIcon('quoteNumber')}
                </div>
              </th>
              {/* Status */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>
                  Status {renderFilterIcon()} {renderSortIcon('status')}
                </div>
              </th>
              {/* Pipeline Stage */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('pipelineStage')}>
                  Pipeline Stage {renderFilterIcon()} {renderSortIcon('pipelineStage')}
                </div>
              </th>
              {/* Quote Amount */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('quoteAmount')}>
                  Total {renderFilterIcon()} {renderSortIcon('quoteAmount')}
                </div>
              </th>
              {/* Entry Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('entryDate')}>
                  Entry Date {renderFilterIcon()} {renderSortIcon('entryDate')}
                </div>
              </th>
              {/* Quote Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('quoteDate')}>
                  Quote Date {renderFilterIcon()} {renderSortIcon('quoteDate')}
                </div>
              </th>
              {/* Exp. Date */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('expirationDate')}>
                  Exp. Date {renderFilterIcon()} {renderSortIcon('expirationDate')}
                </div>
              </th>
              {/* Published */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('published')}>
                  Published {renderFilterIcon()} {renderSortIcon('published')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedQuotes.map((quote) => {
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
                      checked={selectedQuotes.has(quote.id)}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {quotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No quotes found</p>
        </div>
      )}
    </div>
  );
}

export default ListViewV2;
