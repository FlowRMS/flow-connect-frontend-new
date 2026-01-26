/**
 * Customers Content Component - Main Container
 * Clean, modular implementation for the customers page
 */

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters, { type ActiveFilter } from '../advancedFilters/AdvancedFilters';
import SortButton from '../SortButton';
import { useCustomersState } from './hooks/useCustomersState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getCustomerFilterOptions, getCustomerSortOptions } from './config/filterConfig';
import { ListView } from './views/list/ListView';
import { GridView } from './views/grid/GridView';
import { DeleteCustomerModal } from './modals/DeleteCustomerModal';
import { BulkDeleteModal, BulkActionsToolbar } from '../shared';
import { useFilterSync } from '../advancedFilters/hooks/useFilterSync';
import type { FilterOption } from '../advancedFilters/types';

export default function CustomersContent() {
  const router = useRouter();

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'customers';

  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    filteredCustomers,
    totalCount,
    deleteConfirmId,
    setDeleteConfirmId,
    isLoading,
    error,
    refetch,
    isMounted,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSearching,
    uniqueCompanyNames,
    activeFilters,
    handleFiltersChange,
    clientSortColumns,
    handleMultiSortChange,
    handleCustomerDeleted,
    // Bulk selection (from shared hook)
    selectedIds,
    excludedIds,
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
  } = useCustomersState();

  // Navigate to customer edit page
  const handleCustomerClick = (customer: { id: string }) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  // Navigate to customer edit page
  const handleEditCustomer = (customer: { id: string }) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Filter and sort configuration
  const customerFilterOptions = useMemo(
    () => getCustomerFilterOptions(uniqueCompanyNames),
    [uniqueCompanyNames]
  );
  const customerSortOptions = getCustomerSortOptions();

  // Column filters state for table header
  const [columnFilters, setColumnFilters] = useState<Record<string, ActiveFilter[]>>({});

  // Map from UI column keys to filter option IDs (for sync)
  const columnKeyToFilterId: Record<string, string> = useMemo(() => ({
    companyName: 'companyName',
    isParent: 'isParent',
    published: 'published',
    parent: 'parent',
    createdAt: 'createdAt',
  }), []);

  // Hook for synchronizing filters between AdvancedFilters and ColumnFilters
  const { syncAdvancedToColumn, syncColumnToAdvanced } = useFilterSync({
    filterOptions: customerFilterOptions as unknown as FilterOption[],
    columnKeyToFilterId,
  });

  // Refs to prevent infinite loops during synchronization
  const isSyncingFromAdvanced = useRef(false);
  const isSyncingFromColumn = useRef(false);

  // Handle multi-filter change (from AdvancedFilters) with sync to column filters
  const handleFiltersChangeWithSync = useCallback((filters: ActiveFilter[]) => {
    handleFiltersChange(filters);

    if (!isSyncingFromColumn.current) {
      isSyncingFromAdvanced.current = true;
      const syncedColumnFilters = syncAdvancedToColumn(filters);

      setColumnFilters((prev) => {
        if (filters.length === 0) {
          return {};
        }
        return { ...prev, ...syncedColumnFilters };
      });

      setTimeout(() => {
        isSyncingFromAdvanced.current = false;
      }, 0);
    }
  }, [handleFiltersChange, syncAdvancedToColumn]);

  // Handler for column filter changes (from ListView ColumnFilters)
  const handleColumnFiltersChange = useCallback((filters: Record<string, ActiveFilter[]>) => {
    setColumnFilters(filters);

    if (!isSyncingFromAdvanced.current) {
      isSyncingFromColumn.current = true;
      const syncedActiveFilters = syncColumnToAdvanced(filters);
      handleFiltersChange(syncedActiveFilters);

      setTimeout(() => {
        isSyncingFromColumn.current = false;
      }, 0);
    }
  }, [handleFiltersChange, syncColumnToAdvanced]);

  // Determine if we should show loading skeleton (only when applying filters, not during scroll)
  const showLoadingSkeleton = isLoading && !isFetchingNextPage;

  // Find customer to delete
  const customerToDelete = filteredCustomers.find(c => c.id === deleteConfirmId);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--background)] pt-3 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-[var(--border)]/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target - Crown Shine Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="crown-shine"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['customers']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Customers
              </motion.h1>
              <motion.p
                className="text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                Manage your customer accounts
                {(() => {
                  // Prefer showing search result count when searching
                  if (searchQuery.length >= 2 && isSearching !== undefined) {
                    return ` • ${filteredCustomers.length} results for "${searchQuery}"`;
                  }

                  // When using landing page data, show loaded vs total
                  const loaded = filteredCustomers.length;
                  const total = totalCount ?? 0;

                  if (total > 0) {
                    return ` • Showing ${loaded} of ${total} customers`;
                  }

                  // Fallback when total is not available yet
                  return ` • Showing ${loaded} customers`;
                })()}
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <SortButton
              sortOptions={customerSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={customerFilterOptions}
              onFiltersChange={handleFiltersChangeWithSync}
              activeFilters={activeFilters}
            />

            <button
              onClick={() => router.push('/customers/new')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">New Customer</span>
              <span className="sm:hidden">New</span>
            </button>
          </motion.div>
        </div>

        {/* Search Bar and Quick Filter */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              {isSearching ? (
                <svg className="w-full h-full text-[var(--primary)] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-full h-full text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <input
              type="text"
              placeholder="Search customers by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          {/* Quick Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium whitespace-nowrap">Quick filter:</span>
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              {(['All', 'Parent', 'Child'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-white shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--card)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="px-3 sm:px-6">
      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        entityType="CUSTOMERS"
        selectedCount={selectedCount}
        totalCount={totalCount}
        loadedCount={filteredCustomers.length}
        selectAllMode={selectAllMode}
        onClearSelection={clearSelection}
        onDelete={() => setShowBulkDeleteModal(true)}
      />

      {/* Initial Loading State - only show on first mount */}
      {!isMounted && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isMounted && error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load customers</h3>
          <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Views */}
      {isMounted && !error && viewMode === 'grid' && (
        <GridView
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          onEditClick={handleEditCustomer}
          onDeleteClick={(customer) => setDeleteConfirmId(customer.id)}
          selectedIds={selectedIds}
          excludedIds={excludedIds}
          selectAllMode={selectAllMode}
          isItemSelected={isItemSelected}
          onSelectOne={handleSelectOne}
          isLoading={showLoadingSkeleton}
        />
      )}

      {isMounted && !error && viewMode === 'list' && (
        <ListView
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          onEditClick={handleEditCustomer}
          onDeleteClick={(customer) => setDeleteConfirmId(customer.id)}
          selectedIds={selectedIds}
          excludedIds={excludedIds}
          selectAllMode={selectAllMode}
          isItemSelected={isItemSelected}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          isAllSelected={isAllSelected}
          isPartiallySelected={isPartiallySelected}
          isLoading={showLoadingSkeleton}
          columnFilters={columnFilters}
          onColumnFiltersChange={handleColumnFiltersChange}
          filterOptions={customerFilterOptions as unknown as FilterOption[]}
          loadMoreRef={loadMoreRef}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}

      {/* Infinite scroll trigger for grid view */}
      {isMounted && !error && viewMode === 'grid' && filteredCustomers.length > 0 && (
        <>
          <div ref={loadMoreRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading more customers...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {customerToDelete && (
        <DeleteCustomerModal
          isOpen={!!deleteConfirmId}
          customer={customerToDelete}
          onClose={() => setDeleteConfirmId(null)}
          onSuccess={handleCustomerDeleted}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="CUSTOMERS"
        selectedCount={selectedCount}
        getAllSelectedIds={getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['customers']]}
      />
      </div>
    </main>
  );
}
