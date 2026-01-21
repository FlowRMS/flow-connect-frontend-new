/**
 * CreditsListContent Component
 * Main content for the Credits page with full CRUD functionality
 * Includes infinite scroll pagination and search
 */

'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import { useCreditsListState } from './hooks/useCreditsListState';
import type { CreditLandingPage, CreditType, CreditStatus } from '@/components/orders/api/creditsApi';
import { CreditModal } from '@/components/orders/detail/components/modals/credits/CreditModal';
import { CreditDetailModal } from '@/components/orders/detail/components/modals/credits/CreditDetailModal';
import { DeleteConfirmModal } from '@/components/orders/detail/components/modals/utility/DeleteConfirmModal';
import { AvatarInline } from '@/components/ui/CreatedByBadge';
import { fetchOrderById, useOrderSearch } from '@/components/orders/api';
import { transformApiOrderToUiOrder } from '@/components/orders/detail/hooks/useOrderDetailState';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import type { Order } from '@/lib/types/rms';
import { BulkActionsToolbar, BulkDeleteModal } from '@/components/shared';

// Credit Type Configuration with colors
const CREDIT_TYPE_CONFIG: Record<CreditType, { label: string; color: string; bgColor: string }> = {
  RETURN: { label: 'Return', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  PRICE_ADJUSTMENT: { label: 'Price Adj.', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  DEFECTIVE: { label: 'Defective', color: 'text-red-700', bgColor: 'bg-red-100' },
  OTHER: { label: 'Other', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

// Status Configuration
const STATUS_CONFIG: Record<CreditStatus, { label: string; color: string; bgColor: string }> = {
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

export default function CreditsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creditIdFromUrl = searchParams.get('id');

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);
  const initialUrlProcessedRef = useRef(false);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'credits';

  // Order state for CreditModal
  const [orderForModal, setOrderForModal] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Order selection modal for creating new credits
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  // Pass true for allowEmptySearch to pre-populate the dropdown
  const { data: orderSearchResults, isLoading: isSearchingOrders } = useOrderSearch(orderSearchTerm, 20, true);

  const {
    credits,
    isLoadingCredits,
    creditsError,
    refetchCredits,
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
    showCreditModal,
    showCreditDetailModal,
    showDeleteConfirmModal,
    selectedCredit,
    creditToEdit,
    creditToDelete,
    isLoadingCreditDetails,
    openCreateCreditModal: hookOpenCreateCreditModal,
    openEditCreditModal: hookOpenEditCreditModal,
    closeCreditModal: hookCloseCreditModal,
    closeCreditDetailModal: hookCloseCreditDetailModal,
    closeDeleteConfirmModal,
    handleSaveCredit,
    handleDeleteCredit,
    handleConfirmDelete,
    viewCredit,
    editCreditFromDetail: hookEditCreditFromDetail,
    deleteCreditFromDetail,
    isSavingCredit,
    isDeletingCredit,
    // Bulk selection
    selectAllMode,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isItemSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    getAllSelectedIds,
    // Bulk delete modal
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
  } = useCreditsListState();

  // Wrapped close function that also clears URL
  const closeCreditDetailModal = useCallback(() => {
    hookCloseCreditDetailModal();
    // Clear the URL param when closing
    if (searchParams.get('id')) {
      router.replace('/credits', { scroll: false });
    }
  }, [hookCloseCreditDetailModal, router, searchParams]);

  // Wrapped close for credit modal
  const closeCreditModal = useCallback(() => {
    hookCloseCreditModal();
    setOrderForModal(null);
  }, [hookCloseCreditModal]);

  // Open order select modal for creating new credit
  const openOrderSelectModal = useCallback(() => {
    setOrderSearchTerm('');
    setShowOrderSelectModal(true);
  }, []);

  // Close order select modal
  const closeOrderSelectModal = useCallback(() => {
    setShowOrderSelectModal(false);
    setOrderSearchTerm('');
  }, []);

  // Handle order selection for new credit
  const handleOrderSelect = useCallback(async (orderId: string) => {
    setIsLoadingOrder(true);
    closeOrderSelectModal();

    try {
      const apiOrder = await fetchOrderById(orderId);
      if (apiOrder) {
        const uiOrder = transformApiOrderToUiOrder(apiOrder);
        setOrderForModal(uiOrder);
        hookOpenCreateCreditModal();
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [closeOrderSelectModal, hookOpenCreateCreditModal]);

  // Order dropdown options
  const orderOptions = useMemo(() => {
    return (orderSearchResults || []).map(order => ({
      id: order.id,
      label: `#${order.orderNumber}`,
      sublabel: order.jobName || (order.entityDate ? formatDate(order.entityDate) : ''),
    }));
  }, [orderSearchResults]);

  // Wrapped view function that also updates URL
  const handleViewCredit = useCallback((credit: CreditLandingPage) => {
    viewCredit(credit);
    // Update URL to include the credit ID
    router.replace(`/credits?id=${credit.id}`, { scroll: false });
  }, [viewCredit, router]);

  // Open edit credit modal - fetches order first
  const openEditCreditModal = useCallback(async (credit: CreditLandingPage) => {
    if (!credit.orderId) {
      console.error('Credit has no orderId');
      return;
    }

    setIsLoadingOrder(true);
    try {
      const apiOrder = await fetchOrderById(credit.orderId);
      if (apiOrder) {
        // Transform API order to UI order format that CreditModal expects
        const uiOrder = transformApiOrderToUiOrder(apiOrder);
        setOrderForModal(uiOrder);
        hookOpenEditCreditModal(credit);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [hookOpenEditCreditModal]);

  // Edit credit from detail modal
  const editCreditFromDetail = useCallback(async () => {
    if (selectedCredit) {
      closeCreditDetailModal();
      await openEditCreditModal(selectedCredit);
    }
  }, [selectedCredit, closeCreditDetailModal, openEditCreditModal]);

  // Handle URL param to open credit detail modal - only on initial load
  useEffect(() => {
    // Only process URL param once on initial load
    if (initialUrlProcessedRef.current) return;

    if (creditIdFromUrl && credits.length > 0) {
      initialUrlProcessedRef.current = true;
      const credit = credits.find(c => c.id === creditIdFromUrl);
      if (credit) {
        // Use viewCredit directly - URL already has the ID
        viewCredit(credit);
      }
    }
  }, [creditIdFromUrl, credits, viewCredit]);

  // Local filter/sort state (type/status filter and sorting are client-side)
  const [typeFilter, setTypeFilter] = useState<CreditType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<CreditStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'total' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort credits (filters are client-side on the fetched/searched results)
  const filteredCredits = useMemo(() => {
    return (credits || [])
      .filter((credit) => {
        const matchesType = typeFilter === 'ALL' || credit.creditType === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || credit.status === statusFilter;
        return matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = new Date(a.entityDate || '').getTime() - new Date(b.entityDate || '').getTime();
            break;
          case 'total':
            comparison = (a.total || 0) - (b.total || 0);
            break;
          case 'number':
            comparison = (a.creditNumber || '').localeCompare(b.creditNumber || '');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [credits, typeFilter, statusFilter, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const creditAmount = filteredCredits.reduce((sum, c) => {
      const total = typeof c.total === 'number' ? c.total : 0;
      return sum + total;
    }, 0);
    return {
      creditAmount,
      count: filteredCredits.length,
    };
  }, [filteredCredits]);

  const toggleSort = (field: 'date' | 'total' | 'number') => {
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
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="scale-balance"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['credits']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl font-bold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Credits
              </motion.h1>
              <motion.p
                className="text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {searchQuery.length >= 2
                  ? `${filteredCredits.length} results for "${searchQuery}"`
                  : `Showing ${filteredCredits.length} of ${totalCount} credits`}
                {totals.creditAmount > 0 && (
                  <span className="ml-2 font-medium text-red-600">
                    • Total: {formatCurrency(totals.creditAmount)}
                  </span>
                )}
              </motion.p>
            </div>
          </div>

          {/* Create Credit Button */}
          <motion.button
            onClick={openOrderSelectModal}
            disabled={isLoadingOrder}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: morphEase }}
          >
            {isLoadingOrder ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
            )}
            Create Credit
          </motion.button>
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
              placeholder="Search credits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CreditType | 'ALL')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="ALL">All Types</option>
              {(Object.keys(CREDIT_TYPE_CONFIG) as CreditType[]).map((type) => (
                <option key={type} value={type}>
                  {CREDIT_TYPE_CONFIG[type].label}
                </option>
              ))}
            </select>
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
            onClick={() => refetchCredits()}
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
        {isLoadingCredits && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-sm text-[var(--muted-foreground)]">Loading credits...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {creditsError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14v.01"/>
            </svg>
            <span className="text-sm text-red-700">{creditsError.message}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingCredits && !creditsError && filteredCredits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] rounded-xl border-2 border-dashed border-[var(--border)]">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Credits Found</h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 text-center max-w-md">
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No credits match your current filters. Try adjusting your search or filter criteria.'
                : 'Credits will appear here once they are created from order details.'}
            </p>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedCount > 0 && (
          <BulkActionsToolbar
            entityType="CREDITS"
            selectedCount={selectedCount}
            totalCount={totalCount}
            loadedCount={filteredCredits.length}
            selectAllMode={selectAllMode}
            onClearSelection={clearSelection}
            onDelete={() => setShowBulkDeleteModal(true)}
          />
        )}

        {/* Table */}
        {!isLoadingCredits && !creditsError && filteredCredits.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-[var(--muted)]/30">
                <tr>
                  {/* Checkbox column header */}
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)] text-red-600 focus:ring-red-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
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
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Order #</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Reason</th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => toggleSort('total')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      {sortField === 'total' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                          <path d="M5 8l5 5 5-5"/>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Locked</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Created By</th>
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
                      className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${isItemSelected(credit.id) ? 'bg-red-50/50' : ''}`}
                      onClick={() => handleViewCredit(credit)}
                    >
                      {/* Checkbox cell */}
                      <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isItemSelected(credit.id)}
                          onChange={(e) => handleSelectOne(credit.id, e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--border)] text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M8 12h8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {credit.creditNumber || `#${credit.id.substring(0, 8)}`}
                            </p>
                            {credit.locked && (
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
                        {formatDate(credit.entityDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[var(--primary)]">
                          {credit.orderNumber || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeConfig && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
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
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
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
                        <AvatarInline name={credit.createdBy} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewCredit(credit)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                            title="View"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="10" r="3"/>
                              <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                          </button>
                          {!credit.locked && (
                            <>
                              <button
                                onClick={() => openEditCreditModal(credit)}
                                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                                title="Edit"
                                disabled={isLoadingOrder}
                              >
                                {isLoadingOrder ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteCredit(credit)}
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
            </table>
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
            <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading more credits...</span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && filteredCredits.length > 0 && !searchQuery && (
          <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
            All {totalCount} credits loaded
          </div>
        )}
      </div>

      {/* Modals */}
      {orderForModal && (
        <CreditModal
          isOpen={showCreditModal}
          onClose={closeCreditModal}
          order={orderForModal}
          credit={creditToEdit}
          onSubmit={handleSaveCredit}
          isLoading={isSavingCredit}
          isLoadingCreditDetails={isLoadingCreditDetails}
        />
      )}

      <CreditDetailModal
        isOpen={showCreditDetailModal}
        onClose={closeCreditDetailModal}
        credit={selectedCredit}
        onEdit={editCreditFromDetail}
        onDelete={deleteCreditFromDetail}
        isDeleting={isDeletingCredit}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        title="Delete Credit"
        message="Are you sure you want to delete this credit"
        itemName={creditToDelete?.creditNumber || `#${creditToDelete?.id.substring(0, 8)}`}
        isPending={isDeletingCredit}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteConfirmModal}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="CREDITS"
        selectedCount={selectedCount}
        getAllSelectedIds={getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['creditsLandingPage']]}
      />

      {/* Order Selection Modal for Creating New Credit */}
      {showOrderSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Create Credit</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Select an order to create a credit for
                </p>
              </div>
              <button
                onClick={closeOrderSelectModal}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Search for Order
              </label>
              <SearchableDropdownV2
                value=""
                displayValue=""
                onChange={(id) => {
                  if (id) {
                    handleOrderSelect(id);
                  }
                }}
                options={orderOptions}
                onSearch={(term) => setOrderSearchTerm(term)}
                isLoading={isSearchingOrders}
                placeholder="Type order number or customer name..."
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-3">
                Enter at least 2 characters to search. Select an order to proceed with creating a credit.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-end">
              <button
                onClick={closeOrderSelectModal}
                className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
