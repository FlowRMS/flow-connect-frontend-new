'use client';

import React, { useState, useMemo } from 'react';
import type { QuoteV2 } from '../types';

interface ListViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
}

type SortKey = 'quoteNumber' | 'status' | 'stage' | 'quoteAmount' | 'billToCustomerName' | 'entryDate' | 'quoteDate' | 'expirationDate' | 'factoriesCount' | 'soldToCustomerName' | 'jobName' | 'winProbability' | 'approvalStatus' | 'endUsersCount' | 'insideRepName' | 'outsideRepName' | 'published' | 'tags';

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
    case 'OPEN':
      return 'bg-green-100 text-green-700';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStageBadgeClass(stage: string): string {
  switch (stage) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700';
    case 'Review':
      return 'bg-blue-100 text-blue-700';
    case 'Sent':
      return 'bg-purple-100 text-purple-700';
    case 'Negotiating':
      return 'bg-yellow-100 text-yellow-700';
    case 'Won':
      return 'bg-green-100 text-green-700';
    case 'Lost':
      return 'bg-red-100 text-red-700';
    case 'Dormant':
      return 'bg-gray-200 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getApprovalBadgeClass(status: string, count: number): { class: string; text: string } {
  if (count === 0) {
    return { class: 'text-green-600', text: 'Approved' };
  }
  if (status === 'blocked') {
    return { class: 'bg-red-100 text-red-600', text: `${count} Blocked` };
  }
  if (status === 'pending') {
    return { class: 'bg-yellow-100 text-yellow-600', text: `${count} Pending` };
  }
  return { class: 'text-green-600', text: 'Approved' };
}

function getWinProbabilityDisplay(probability: number, approvalStatus: string) {
  const isDown = probability < 50;
  let colorClass = '';

  if (approvalStatus === 'blocked') {
    colorClass = 'text-red-600';
  } else if (probability >= 70) {
    colorClass = 'text-green-600';
  } else if (probability >= 40) {
    colorClass = 'text-yellow-600';
  } else {
    colorClass = 'text-red-600';
  }

  return { colorClass, isDown };
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
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortColumn) {
        case 'quoteNumber':
          aVal = a.quoteNumber;
          bVal = b.quoteNumber;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'stage':
          aVal = a.stage;
          bVal = b.stage;
          break;
        case 'quoteAmount':
          aVal = a.quoteAmount;
          bVal = b.quoteAmount;
          break;
        case 'billToCustomerName':
          aVal = a.billToCustomerName;
          bVal = b.billToCustomerName;
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
        case 'soldToCustomerName':
          aVal = a.soldToCustomerName;
          bVal = b.soldToCustomerName;
          break;
        case 'jobName':
          aVal = a.jobName;
          bVal = b.jobName;
          break;
        case 'winProbability':
          aVal = a.winProbability;
          bVal = b.winProbability;
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const isExpiringSoon = (dateStr: string): boolean => {
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1800px]">
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
              {/* Stage */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('stage')}>
                  Stage {renderFilterIcon()} {renderSortIcon('stage')}
                </div>
              </th>
              {/* Quote Amount */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('quoteAmount')}>
                  Quote Amount {renderFilterIcon()} {renderSortIcon('quoteAmount')}
                </div>
              </th>
              {/* Bill-To */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('billToCustomerName')}>
                  Bill-To {renderFilterIcon()} {renderSortIcon('billToCustomerName')}
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
              {/* Factory */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Factory {renderFilterIcon()}</div>
              </th>
              {/* Customer */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('soldToCustomerName')}>
                  Customer {renderFilterIcon()} {renderSortIcon('soldToCustomerName')}
                </div>
              </th>
              {/* Job Name */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('jobName')}>
                  Job Name {renderFilterIcon()} {renderSortIcon('jobName')}
                </div>
              </th>
              {/* Win % */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer hover:text-gray-700" onClick={() => handleSort('winProbability')}>
                  Win % {renderFilterIcon()} {renderSortIcon('winProbability')}
                </div>
              </th>
              {/* Approvals */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Approvals {renderFilterIcon()}</div>
              </th>
              {/* End Users */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">End Users {renderFilterIcon()}</div>
              </th>
              {/* Inside Reps */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Inside Reps {renderFilterIcon()}</div>
              </th>
              {/* Outside Reps */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Outside Reps {renderFilterIcon()}</div>
              </th>
              {/* Published */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Published {renderFilterIcon()}</div>
              </th>
              {/* Tags */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">Tags {renderFilterIcon()}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedQuotes.map((quote) => {
              const approvalInfo = getApprovalBadgeClass(quote.approvalStatus, quote.pendingApprovals + quote.blockedApprovals);
              const winProb = getWinProbabilityDisplay(quote.winProbability, quote.approvalStatus);

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
                  {/* Stage */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStageBadgeClass(quote.stage)}`}>
                      {quote.stage}
                    </span>
                  </td>
                  {/* Quote Amount */}
                  <td className="px-3 py-3 text-sm text-gray-900">${quote.quoteAmount.toLocaleString()}</td>
                  {/* Bill-To */}
                  <td className="px-3 py-3 text-sm text-gray-900 max-w-[120px] truncate">{quote.billToCustomerName}</td>
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
                  {/* Factory */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">M</span>
                      <span className="text-sm text-gray-500">{quote.factoriesCount} Factories</span>
                    </div>
                  </td>
                  {/* Customer */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        {quote.soldToCustomerName.charAt(0)}
                      </span>
                      <span className="text-sm text-gray-900 truncate max-w-[100px]">{quote.soldToCustomerName}</span>
                    </div>
                  </td>
                  {/* Job Name */}
                  <td className="px-3 py-3 text-sm text-gray-900 max-w-[150px] truncate">{quote.jobName}</td>
                  {/* Win % */}
                  <td className="px-3 py-3">
                    <div className={`flex items-center gap-1 ${winProb.colorClass}`}>
                      <span className="text-sm font-medium">{quote.winProbability}%</span>
                      {winProb.isDown ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 9L2 5h8L6 9z" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 3L10 7H2L6 3z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  {/* Approvals */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${approvalInfo.class}`}>
                      {approvalInfo.text}
                    </span>
                  </td>
                  {/* End Users */}
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {quote.endUsersCount > 0 ? `${quote.endUsersCount} End Users` : '-'}
                  </td>
                  {/* Inside Reps */}
                  <td className="px-3 py-3 text-sm text-gray-900">{quote.insideRepName || '-'}</td>
                  {/* Outside Reps */}
                  <td className="px-3 py-3 text-sm text-gray-900">{quote.outsideRepName || '-'}</td>
                  {/* Published */}
                  <td className="px-3 py-3 text-center">
                    {quote.published ? (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-500 mx-auto">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* Tags */}
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {quote.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListViewV2;
