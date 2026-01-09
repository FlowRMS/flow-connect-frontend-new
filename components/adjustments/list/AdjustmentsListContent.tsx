/**
 * AdjustmentsListContent Component
 * Main content for the Adjustments page with full CRUD functionality
 * Includes infinite scroll pagination and search
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdjustmentsListState } from './hooks/useAdjustmentsListState';
import type { AdjustmentLandingPage, AdjustmentStatus } from '@/components/orders/api/adjustmentsApi';
import { AdjustmentModal } from '@/components/orders/detail/components/modals/adjustments/AdjustmentModal';
import { AdjustmentDetailModal } from '@/components/orders/detail/components/modals/adjustments/AdjustmentDetailModal';
import { DeleteConfirmModal } from '@/components/orders/detail/components/modals/utility/DeleteConfirmModal';
import { AvatarInline } from '@/components/ui/CreatedByBadge';

// Status Configuration
const STATUS_CONFIG: Record<AdjustmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function AdjustmentsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adjustmentIdFromUrl = searchParams.get('id');

  const {
    adjustments,
    isLoadingAdjustments,
    adjustmentsError,
    refetchAdjustments,
    // Pagination
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
    // Search
    searchQuery,
    setSearchQuery,
    isSearching,
    // Modals
    showAdjustmentModal,
    showAdjustmentDetailModal,
    showDeleteConfirmModal,
    selectedAdjustment,
    adjustmentToEdit,
    adjustmentToDelete,
    isLoadingAdjustmentDetails,
    openCreateAdjustmentModal,
    openEditAdjustmentModal,
    closeAdjustmentModal,
    closeAdjustmentDetailModal,
    closeDeleteConfirmModal,
    handleSaveAdjustment,
    handleDeleteAdjustment,
    handleConfirmDelete,
    viewAdjustment,
    editAdjustmentFromDetail,
    deleteAdjustmentFromDetail,
    isSavingAdjustment,
    isDeletingAdjustment,
  } = useAdjustmentsListState();

  // Handle URL param to open adjustment detail modal
  useEffect(() => {
    if (adjustmentIdFromUrl && adjustments.length > 0 && !showAdjustmentDetailModal) {
      const adjustment = adjustments.find(a => a.id === adjustmentIdFromUrl);
      if (adjustment) {
        viewAdjustment(adjustment);
      }
    }
  }, [adjustmentIdFromUrl, adjustments, showAdjustmentDetailModal, viewAdjustment]);

  // Update URL when modal is opened/closed
  useEffect(() => {
    if (selectedAdjustment && !searchParams.get('id')) {
      router.replace(`/adjustments?id=${selectedAdjustment.id}`, { scroll: false });
    } else if (!selectedAdjustment && searchParams.get('id')) {
      router.replace('/adjustments', { scroll: false });
    }
  }, [selectedAdjustment, router, searchParams]);

  // Local filter/sort state (status filter and sorting are client-side)
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort adjustments (status filter is client-side on the fetched/searched results)
  const filteredAdjustments = useMemo(() => {
    return (adjustments || [])
      .filter((adj) => {
        const matchesStatus = statusFilter === 'ALL' || adj.status === statusFilter;
        return matchesStatus;
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
  }, [adjustments, statusFilter, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => ({
    adjustmentAmount: filteredAdjustments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0),
    count: filteredAdjustments.length,
  }), [filteredAdjustments]);

  const toggleSort = (field: 'date' | 'amount' | 'number') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Adjustments</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {searchQuery.length >= 2
                  ? `${filteredAdjustments.length} results for "${searchQuery}"`
                  : `Showing ${filteredAdjustments.length} of ${totalCount} adjustments`}
                {totals.adjustmentAmount !== 0 && (
                  <span className="ml-2 font-medium text-indigo-600">
                    • Total: {formatCurrency(totals.adjustmentAmount)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={openCreateAdjustmentModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            Add Adjustment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search - uses API search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              </div>
            )}
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

          {/* Refresh Button */}
          <button
            onClick={() => refetchAdjustments()}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10a7 7 0 1114 0M3 10V4m0 6h6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area with scroll handler for infinite scroll */}
      <div className="flex-1 overflow-auto p-6 bg-[var(--background)]" onScroll={handleScroll}>
        {/* Loading State */}
        {isLoadingAdjustments && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-sm text-[var(--muted-foreground)]">Loading adjustments...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {adjustmentsError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14v.01"/>
            </svg>
            <span className="text-sm text-red-700">{adjustmentsError.message}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAdjustments && !adjustmentsError && filteredAdjustments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] rounded-xl border-2 border-dashed border-[var(--border)]">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Adjustments Yet</h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 text-center max-w-md">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No adjustments match your current filters. Try adjusting your search or filter criteria.'
                : 'Create your first commission adjustment to get started.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={openCreateAdjustmentModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
        {!isLoadingAdjustments && !adjustmentsError && filteredAdjustments.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
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
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Created By</th>
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
                      onClick={() => viewAdjustment(adjustment)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
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
                      <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[250px] truncate" title={adjustment.reason || ''}>
                        {adjustment.reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                        {formatCurrency(parseFloat(adjustment.amount || '0'))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {statusConfig && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AvatarInline name={(adjustment as any).createdBy} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => viewAdjustment(adjustment)}
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
                                onClick={() => openEditAdjustmentModal(adjustment)}
                                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteAdjustment(adjustment)}
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
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-sm">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(totals.adjustmentAmount)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading more adjustments...</span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && filteredAdjustments.length > 0 && !searchQuery && (
          <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
            All {totalCount} adjustments loaded
          </div>
        )}
      </div>

      {/* Modals */}
      <AdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={closeAdjustmentModal}
        adjustment={adjustmentToEdit}
        onSubmit={handleSaveAdjustment}
        isLoading={isSavingAdjustment}
        isLoadingAdjustmentDetails={isLoadingAdjustmentDetails}
      />

      <AdjustmentDetailModal
        isOpen={showAdjustmentDetailModal}
        onClose={closeAdjustmentDetailModal}
        adjustment={selectedAdjustment}
        onEdit={editAdjustmentFromDetail}
        onDelete={deleteAdjustmentFromDetail}
        isDeleting={isDeletingAdjustment}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        title="Delete Adjustment"
        message="Are you sure you want to delete this adjustment"
        itemName={adjustmentToDelete?.adjustmentNumber || `#${adjustmentToDelete?.id.substring(0, 8)}`}
        isPending={isDeletingAdjustment}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteConfirmModal}
      />
    </div>
  );
}
