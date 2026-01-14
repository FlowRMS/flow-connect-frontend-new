/**
 * AdjustmentsTab Component
 * Displays adjustments with full functionality
 */

'use client';

import React, { useState } from 'react';
import type { AdjustmentLandingPage, AdjustmentStatus } from '../../../api/adjustmentsApi';
import { formatCurrency } from '../../utils';

// Status Configuration
const STATUS_CONFIG: Record<AdjustmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface AdjustmentsTabProps {
  adjustments?: AdjustmentLandingPage[];
  isLoading?: boolean;
  error?: Error | null;
  onAddAdjustment: () => void;
  onViewAdjustment?: (adjustment: AdjustmentLandingPage) => void;
  onEditAdjustment?: (adjustment: AdjustmentLandingPage) => void;
  onDeleteAdjustment?: (adjustment: AdjustmentLandingPage) => void;
}

export function AdjustmentsTab({
  adjustments = [],
  isLoading = false,
  error = null,
  onAddAdjustment,
  onViewAdjustment,
  onEditAdjustment,
  onDeleteAdjustment,
}: AdjustmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort adjustments
  const filteredAdjustments = adjustments
    .filter((adj) => {
      const matchesSearch =
        !searchTerm ||
        adj.adjustmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || adj.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.entityDate || '').getTime() - new Date(b.entityDate || '').getTime();
          break;
        case 'amount':
          comparison = parseFloat(a.amount || '0') - parseFloat(b.amount || '0');
          break;
        case 'number':
          comparison = (a.adjustmentNumber || '').localeCompare(b.adjustmentNumber || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Calculate totals
  const totals = {
    adjustmentAmount: filteredAdjustments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0),
    count: filteredAdjustments.length,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSort = (field: 'date' | 'amount' | 'number') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Adjustments</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {filteredAdjustments.length} adjustment{filteredAdjustments.length !== 1 ? 's' : ''}
              {totals.adjustmentAmount !== 0 && (
                <span className="ml-2 font-medium text-indigo-600">
                  Total: {formatCurrency(totals.adjustmentAmount)}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onAddAdjustment}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
          </svg>
          Add Adjustment
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <circle cx="9" cy="9" r="6"/>
            <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search adjustments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">Status:</span>
          <div className="flex gap-1">
            {(['ALL', 'PENDING', 'POSTED', 'VOID'] as const).map((status) => {
              const isActive = statusFilter === status;
              const config = status !== 'ALL' ? STATUS_CONFIG[status] : null;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? status === 'ALL'
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : `${config?.bgColor} ${config?.color}`
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                  }`}
                >
                  {status === 'ALL' ? 'All' : config?.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm text-[var(--muted-foreground)]">Loading adjustments...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
            <circle cx="10" cy="10" r="8"/>
            <path d="M10 6v4M10 14v.01"/>
          </svg>
          <span className="text-sm text-red-700">{error.message}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAdjustments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-[var(--muted)]/20 rounded-xl border-2 border-dashed border-[var(--border)]">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-[var(--foreground)] mb-1">No Adjustments Yet</h4>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No adjustments match your filters'
              : 'Create your first adjustment to get started'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <button
              onClick={onAddAdjustment}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
              </svg>
              Add Adjustment
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && filteredAdjustments.length > 0 && (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30">
              <tr>
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('number')}
                >
                  <div className="flex items-center gap-1">
                    Adjustment #
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
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Reason</th>
                <th
                  className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortField === 'amount' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAdjustments.map((adjustment) => {
                const statusConfig = adjustment.status ? STATUS_CONFIG[adjustment.status] : null;

                return (
                  <tr
                    key={adjustment.id}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                    onClick={() => onViewAdjustment?.(adjustment)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">
                            {adjustment.adjustmentNumber || `#${adjustment.id.substring(0, 8)}`}
                          </p>
                          {adjustment.locked && (
                            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                              </svg>
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {formatDate(adjustment.entityDate)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px] truncate" title={adjustment.reason || ''}>
                      {adjustment.reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                      {formatCurrency(parseFloat(adjustment.amount || '0'))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusConfig && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewAdjustment?.(adjustment)}
                          className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                          title="View"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="10" r="3"/>
                            <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                          </svg>
                        </button>
                        {!adjustment.locked && (
                          <>
                            <button
                              onClick={() => onEditAdjustment?.(adjustment)}
                              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteAdjustment?.(adjustment)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredAdjustments.length > 0 && (
              <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(totals.adjustmentAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
