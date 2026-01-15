/**
 * CreditsTab Component
 * Displays credits for the order with full functionality
 */

'use client';

import React, { useState } from 'react';
import type { CreditLandingPage, CreditType } from '../../../api/creditsApi';
import { formatCurrency } from '../../utils';

// Credit Type Configuration with colors
const CREDIT_TYPE_CONFIG: Record<CreditType, { label: string; color: string; bgColor: string; icon: string }> = {
  RETURN: { label: 'Return', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '↩' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '✕' },
  PRICE_ADJUSTMENT: { label: 'Price Adj.', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '$' },
  DEFECTIVE: { label: 'Defective', color: 'text-red-700', bgColor: 'bg-red-100', icon: '!' },
  OTHER: { label: 'Other', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: '?' },
};

// Status Configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface CreditsTabProps {
  credits?: CreditLandingPage[];
  isLoading?: boolean;
  error?: Error | null;
  onAddCredit: () => void;
  onViewCredit?: (credit: CreditLandingPage) => void;
  onEditCredit?: (credit: CreditLandingPage) => void;
  onDeleteCredit?: (credit: CreditLandingPage) => void;
}

export function CreditsTab({
  credits = [],
  isLoading = false,
  error = null,
  onAddCredit,
  onViewCredit,
  onEditCredit,
  onDeleteCredit,
}: CreditsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CreditType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort credits
  const filteredCredits = credits
    .filter(credit => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !credit.creditNumber?.toLowerCase().includes(search) &&
          !credit.reason?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      // Type filter
      if (filterType !== 'ALL' && credit.creditType !== filterType) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'ALL' && credit.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.entityDate || '').getTime() - new Date(b.entityDate || '').getTime();
          break;
        case 'amount':
          comparison = (a.total || 0) - (b.total || 0);
          break;
        case 'number':
          comparison = (a.creditNumber || '').localeCompare(b.creditNumber || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Calculate totals
  const totals = {
    creditAmount: filteredCredits.reduce((sum, c) => sum + (c.total || 0), 0),
    count: filteredCredits.length,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading credits...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16v.01"/>
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-2">Failed to load credits</p>
          <p className="text-xs text-[var(--muted-foreground)]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Credits</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              {totals.count} credit{totals.count !== 1 ? 's' : ''}
            </span>
            {totals.creditAmount !== 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                {formatCurrency(totals.creditAmount)} total
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onAddCredit}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Add Credit
        </button>
      </div>

      {/* Filters */}
      {credits.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="6"/>
              <path d="M13 13l4 4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search credits..."
              className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CreditType | 'ALL')}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="ALL">All Types</option>
            {(Object.keys(CREDIT_TYPE_CONFIG) as CreditType[]).map(type => (
              <option key={type} value={type}>{CREDIT_TYPE_CONFIG[type].label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(status => (
              <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Credits Table */}
      {filteredCredits.length === 0 ? (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
            <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">
              {credits.length === 0 ? 'No Credits Yet' : 'No Matching Credits'}
            </h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm mx-auto">
              {credits.length === 0
                ? 'Credits represent returns, cancellations, or price adjustments that reduce order totals.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {credits.length === 0 && (
              <button
                onClick={onAddCredit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Create First Credit
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('number')}
                >
                  <div className="flex items-center gap-1">
                    Credit #
                    {sortField === 'number' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Reason</th>
                <th
                  className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total
                    {sortField === 'amount' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Locked</th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCredits.map((credit) => {
                const typeConfig = credit.creditType ? CREDIT_TYPE_CONFIG[credit.creditType] : null;
                const statusConfig = credit.status ? STATUS_CONFIG[credit.status] : null;

                return (
                  <tr
                    key={credit.id}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                    onClick={() => onViewCredit?.(credit)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--primary)]">
                          {credit.creditNumber || `CR-${credit.id.substring(0, 8)}`}
                        </span>
                        {credit.locked && (
                          <span title="Locked">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {formatDate(credit.entityDate)}
                    </td>
                    <td className="px-4 py-3">
                      {typeConfig && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px] truncate" title={credit.reason || ''}>
                      {credit.reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {formatCurrency(credit.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusConfig && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {credit.locked ? (
                        <span title="Locked">
                          <svg className="w-5 h-5 text-amber-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                      ) : (
                        <span title="Unlocked">
                          <svg className="w-5 h-5 text-gray-300 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewCredit?.(credit)}
                          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                          title="View details"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="10" r="3"/>
                            <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                          </svg>
                        </button>
                        {!credit.locked && onEditCredit && (
                          <button
                            onClick={() => onEditCredit(credit)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                            title="Edit credit"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                            </svg>
                          </button>
                        )}
                        {!credit.locked && onDeleteCredit && (
                          <button
                            onClick={() => onDeleteCredit(credit)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                            title="Delete credit"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredCredits.length > 0 && (
              <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(totals.creditAmount)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
