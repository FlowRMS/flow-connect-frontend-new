/**
 *
 * OrdersListContent Component
 * Main container for the orders list
 *
 */

'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters from '@/components/advancedFilters/AdvancedFilters';
import SortButton from '@/components/SortButton';
import { useOrdersListState } from './hooks/useOrdersListState';
import { getOrderFilterOptions, getOrderSortOptions } from './config/filterConfig';
import { OrdersTable } from './components/table/OrdersTable';
import { OrdersEmptyState } from './components/table/OrdersEmptyState';
import { QuickDateFilter } from './components/QuickDateFilter';
import { OrderDetailPanel } from './components/sidebar/OrderDetailPanel';
import {
  CreditModal,
  AcknowledgementModal,
} from './components/modals';
import { BulkDeleteModal } from '@/components/shared/modals/BulkDeleteModal';
import { SaveViewButton } from '@/components/shared';
import { orderQueryKeys } from '../api/useOrdersApi';
import { useOrderSettings } from '@/contexts/UserSettingsContext';
import type { SavedViewState } from '@/components/lib/graphql/settings';
import { ExportExcelButton, useEntityExport } from '@/components/shared/excel-export';
import { mapDataForExport } from '@/components/shared/excel-export/useListExport';
import { ORDER_TABLE_COLUMNS } from './config/columnConfig';
import { getQuickDateRange } from './utils';
import type { QuickDatePreset } from './types';
import { fetchOrdersWithPagination } from '@/components/lib/graphql/orders';

export default function OrdersListContent() {
  const router = useRouter();
  const state = useOrdersListState();
  const { settings: orderSettings, saveSettings: saveOrderSettings, isLoading: isSettingsLoading } = useOrderSettings();

  // Get current view state for saving
  const getCurrentViewState = (): SavedViewState => ({
    filters: state.activeFilters.map(f => ({
      operator: f.operator,
      columnName: f.columnName,
      value: f.value,
      values: f.values,
    })),
    columnFilters: Object.fromEntries(
      Object.entries(state.columnFilters || {}).map(([key, filters]) => [
        key,
        filters.map(f => ({
          operator: f.operator,
          columnName: f.columnName,
          value: f.value,
          values: f.values,
        })),
      ])
    ),
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    quickDatePreset: state.quickDatePreset,
    quickDateField: state.quickDateField,
  });

  // Save current view state
  const handleSaveView = async (viewState: SavedViewState): Promise<boolean> => {
    const updatedSettings = {
      ...orderSettings,
      columnConfig: orderSettings?.columnConfig || [],
      showEndUserPerLine: orderSettings?.showEndUserPerLine ?? false,
      showOutsideRepPerLine: orderSettings?.showOutsideRepPerLine ?? false,
      showInsideRepPerLine: orderSettings?.showInsideRepPerLine ?? false,
      savedView: viewState,
    };
    return saveOrderSettings(updatedSettings, 'my');
  };

  // Clear saved view state
  const handleClearView = async (): Promise<boolean> => {
    const updatedSettings = {
      ...orderSettings,
      columnConfig: orderSettings?.columnConfig || [],
      showEndUserPerLine: orderSettings?.showEndUserPerLine ?? false,
      showOutsideRepPerLine: orderSettings?.showOutsideRepPerLine ?? false,
      showInsideRepPerLine: orderSettings?.showInsideRepPerLine ?? false,
      savedView: undefined,
    };
    const success = await saveOrderSettings(updatedSettings, 'my');
    if (success) {
      // Reset to defaults
      window.location.reload();
    }
    return success;
  };

  const hasSavedView = !!orderSettings?.savedView;

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'orders';

  const filterOptions = getOrderFilterOptions();
  const sortOptions = getOrderSortOptions();
  
  // Map serverOrderBy to ActiveSort[] format for SortButton
  // The columnName should match API field names directly
  const activeSorts = useMemo(() => {
    return state.serverOrderBy.map(orderBy => ({
      columnName: orderBy.columnName,
      direction: orderBy.direction,
    }));
  }, [state.serverOrderBy]);

  // Excel export hook
  const { context: exportContext } = useEntityExport({
    data: state.allOrdersData as unknown as Record<string, unknown>[],
    activeFilters: state.activeFilters,
    columnFilters: state.columnFilters,
    quickDatePreset: state.quickDatePreset,
    quickDateField: state.quickDateField,
    sorting: state.serverOrderBy,
    searchQuery: state.searchQuery,
    config: {
      entityType: 'orders',
      columns: ORDER_TABLE_COLUMNS,
      getQuickDateRange: (preset: string) => getQuickDateRange(preset as QuickDatePreset),
      reportTitle: 'Orders Export',
    },
  });

  // Fetch ALL records for export (not just loaded via infinite scroll)
  const fetchAllOrdersForExport = useCallback(async () => {
    // Build the same filters used by the landing page query
    const quickFilters: { operator: 'GTE' | 'LTE'; columnName: string; value?: string }[] = [];
    if (state.quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(state.quickDatePreset as QuickDatePreset);
      if (start && end) {
        const columnName = state.quickDateField === 'createdAt' ? 'createdAt' : 'entityDate';
        const fmt = (d: Date) => columnName === 'entityDate'
          ? d.toISOString().split('T')[0]
          : `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0]}`;
        quickFilters.push({ columnName, operator: 'GTE' as const, value: fmt(start) });
        quickFilters.push({ columnName, operator: 'LTE' as const, value: fmt(end) });
      }
    }
    const allFilters = [...quickFilters, ...state.serverFilters];

    // Fetch total, then all records in one request
    const initial = await fetchOrdersWithPagination(allFilters, state.serverOrderBy, { limit: 1, offset: 0 });
    const total = initial.total;
    if (total === 0) return [];

    const result = await fetchOrdersWithPagination(allFilters, state.serverOrderBy, { limit: total, offset: 0 });
    return mapDataForExport(result.records as unknown as Record<string, unknown>[], ORDER_TABLE_COLUMNS);
  }, [state.quickDatePreset, state.quickDateField, state.serverFilters, state.serverOrderBy]);

  // Handler for column sort click - only allows one sort at a time (replaces previous)
  const handleColumnSort = useCallback((columnName: string) => {
    // Check if this column is already the active sort
    const currentSort = activeSorts.find((s: { columnName: string; direction: string }) => s.columnName === columnName);
    
    if (currentSort) {
      // Column is already sorted - toggle direction (replace with new direction)
      const newDirection = currentSort.direction === 'ASC' ? 'DESC' : 'ASC';
      state.handleMultiSortChange([{ columnName, direction: newDirection }]);
    } else {
      // Replace all sorts with this new one - default to ASC
      state.handleMultiSortChange([{ columnName, direction: 'ASC' }]);
    }
  }, [activeSorts, state.handleMultiSortChange]);

  // Determine if we're loading (only initial load, not when fetching more pages)
  const isLoading = state.isLoading;

  // Check if there are any filters applied (advanced filters, quick date filter, column filters, or search)
  const hasFilters = state.activeFilters.length > 0 || 
                     state.quickDatePreset !== 'all' || 
                     Object.keys(state.columnFilters || {}).length > 0 ||
                     (state.searchQuery.length >= 2);

  // Error state
  if (state.error) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Error Loading Orders</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">{state.error.message}</p>
          <button
            onClick={() => state.refetch()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedOrder ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Morphing Icon Target - Package Reveal Animation */}
              <HeaderIconAnimation
                isReceivingAnimation={isReceivingAnimation}
                animationStyle="package-reveal"
                headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
              >
                {iconMap['orders']}
              </HeaderIconAnimation>
              <div className="overflow-hidden">
                <motion.h1
                  className="text-2xl font-semibold text-[var(--foreground)]"
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
                >
                  Orders
                </motion.h1>
                <motion.p
                  className="text-sm text-[var(--muted-foreground)] mt-1"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
                >
                  {state.searchQuery.length >= 2
                    ? `${state.filteredOrders.length} results for "${state.searchQuery}"`
                    : `Showing ${state.filteredOrders.length} of ${state.totalCount} orders`}
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
            >
              {/* Search Bar */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={state.searchQuery}
                  onChange={(e) => state.setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                {state.searchQuery && (
                  <button
                    onClick={() => state.setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {state.isSearching && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                  </div>
                )}
              </div>

              <AdvancedFilters
                filterOptions={filterOptions}
                onFiltersChange={state.handleServerFiltersChange}
                activeFilters={state.activeFilters}
              />
              
              <SortButton
                sortOptions={sortOptions}
                onMultiSortChange={state.handleMultiSortChange}
                activeSorts={activeSorts}
              />

              <SaveViewButton
                onSave={handleSaveView}
                onClear={handleClearView}
                getCurrentViewState={getCurrentViewState}
                hasSavedView={hasSavedView}
                isSaving={isSettingsLoading}
              />

              <button
                onClick={() => router.push('/orders/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                </svg>
                New Order
              </button>
            </motion.div>
          </div>

          {/* Quick Date Filter and Export Button */}
          <div className="mt-4 flex items-center justify-between">
            <QuickDateFilter
              quickDatePreset={state.quickDatePreset}
              setQuickDatePreset={state.setQuickDatePreset}
              quickDateField={state.quickDateField}
              setQuickDateField={state.setQuickDateField}
              showQuickDateFieldDropdown={state.showQuickDateFieldDropdown}
              setShowQuickDateFieldDropdown={state.setShowQuickDateFieldDropdown}
            />
            <ExportExcelButton
              context={exportContext}
              options={{}}
              fetchAllData={fetchAllOrdersForExport}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <OrdersTable
            filteredOrders={state.filteredOrders}
            isLoading={isLoading}
            hasFilters={hasFilters}
            selectedOrderIds={state.selectedOrderIds}
            toggleOrderSelection={state.toggleOrderSelection}
            selectAllOrders={state.selectAllOrders}
            clearSelection={state.clearSelection}
            areAllEligibleSelected={state.areAllEligibleSelected}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={state.bulkDelete}
            setSelectedOrder={state.setSelectedOrder}
            onColumnFiltersChange={state.handleColumnFiltersChange}
            filterOptions={state.orderFilterOptionsWithValues}
            columnFilters={state.columnFilters}
            hasNextPage={state.hasNextPage}
            isFetchingNextPage={state.isFetchingNextPage}
            fetchNextPage={state.fetchNextPage}
            searchQuery={state.searchQuery}
            activeSorts={activeSorts}
            onSortChange={handleColumnSort}
            isFetching={state.isFetching}
          />

          {/* Empty State - shown outside table when no data */}
          {!isLoading && state.filteredOrders.length === 0 && (
            <OrdersEmptyState hasFilters={hasFilters} onClearFilters={state.clearAllFilters} />
          )}

          {/* Loading indicator for infinite scroll */}
          {state.isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
              <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading more orders...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!state.hasNextPage && state.filteredOrders.length > 0 && !state.searchQuery && (
            <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
              All {state.totalCount} orders loaded
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {state.selectedOrder && (
        <OrderDetailPanel
          order={state.selectedOrder}
          onClose={() => state.setSelectedOrder(null)}
          editingSplits={state.editingSplits}
          editedSplits={state.editedSplits}
          splitPercentageTotal={state.splitPercentageTotal}
          onStartEditingSplits={state.startEditingSplits}
          onCancelEditingSplits={state.cancelEditingSplits}
          onSaveSplits={state.saveSplits}
          onUpdateSplitPercentage={state.updateSplitPercentage}
          onAddNewSplit={state.addNewSplit}
          onRemoveSplit={state.removeSplit}
          onUpdateSplitRep={state.updateSplitRep}
        />
      )}

      {/* Modals */}
      <CreditModal
        isOpen={state.showCreditModal}
        onClose={state.closeCreditModal}
        creditName={state.creditName}
        setCreditName={state.setCreditName}
        creditDate={state.creditDate}
        setCreditDate={state.setCreditDate}
        creditLineItems={state.creditLineItems}
        setCreditLineItems={state.setCreditLineItems}
        onSave={state.saveCredit}
      />

      <AcknowledgementModal
        isOpen={state.showAcknowledgementModal}
        onClose={state.closeAcknowledgementModal}
        selectedOrderNumbers={
          Array.from(state.selectedOrderIds)
            .map((id) => state.orders.find((o) => o.id === id)?.orderNumber)
            .filter((n): n is string => !!n)
        }
        ackNumber={state.ackNumber}
        setAckNumber={state.setAckNumber}
        ackDate={state.ackDate}
        setAckDate={state.setAckDate}
        ackLineItems={state.ackLineItems}
        setAckLineItems={state.setAckLineItems}
        onSubmit={state.saveAcknowledgement}
      />

      <BulkDeleteModal
        isOpen={state.showDeleteModal}
        entityType="ORDERS"
        selectedCount={state.selectedCount}
        getAllSelectedIds={state.getAllSelectedIds}
        onClose={state.closeDeleteModal}
        onSuccess={state.handleDeleteSuccess}
        queryKeysToInvalidate={[[...orderQueryKeys.all], [...orderQueryKeys.orders()]]}
      />
    </main>
  );
}
