/**
 * InvoicesListContent Component
 * Main container for the invoices list
 * Uses real API data with search and infinite scroll pagination
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters from '@/components/advancedFilters/AdvancedFilters';
import SortButton from '@/components/SortButton';
import { useInvoicesListState } from './hooks/useInvoicesListState';
import { getInvoiceFilterOptions, getInvoiceSortOptions } from './config/filterConfig';
import { InvoicesTable } from './components/table/InvoicesTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { InvoiceDetailPanel } from './components/sidebar/InvoiceDetailPanel';
import {
  RecordPaymentModal,
  CreateInvoiceModal,
} from './components/modals';
import { BulkDeleteModal, BulkActionsToolbar, SaveViewButton } from '../../shared';
import { InvoicesEmptyState } from './components/table';
import { useInvoiceSettings } from '@/contexts/UserSettingsContext';
import type { SavedViewState } from '@/components/lib/graphql/settings';
import { ExportExcelButton, useEntityExport } from '@/components/shared/excel-export';
import { INVOICE_TABLE_COLUMNS } from './config/columnConfig';
import { getQuickDateRange } from './utils';
import type { QuickDatePreset } from './types';

export default function InvoicesListContent() {
  const state = useInvoicesListState();
  const { settings: invoiceSettings, saveSettings: saveInvoiceSettings, isLoading: isSettingsLoading } = useInvoiceSettings();

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
      ...invoiceSettings,
      columnConfig: invoiceSettings?.columnConfig || [],
      dueDateOffset: invoiceSettings?.dueDateOffset,
      savedView: viewState,
    };
    return saveInvoiceSettings(updatedSettings, 'my');
  };

  // Clear saved view state
  const handleClearView = async (): Promise<boolean> => {
    const updatedSettings = {
      ...invoiceSettings,
      columnConfig: invoiceSettings?.columnConfig || [],
      dueDateOffset: invoiceSettings?.dueDateOffset,
      savedView: undefined,
    };
    const success = await saveInvoiceSettings(updatedSettings, 'my');
    if (success) {
      window.location.reload();
    }
    return success;
  };

  const hasSavedView = !!invoiceSettings?.savedView;

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

  const isReceivingAnimation = floatingIcon?.itemId === 'invoices';

  const filterOptions = getInvoiceFilterOptions();
  const sortOptions = getInvoiceSortOptions();
  
  // Map sortField and sortDirection to ActiveSort format for SortButton
  // The columnName should match API field names directly
  const activeSort = state.sortField && state.sortDirection
    ? {
        columnName: (() => {
          const fieldMap: Record<string, string> = {
            invoiceNumber: 'invoiceNumber',
            status: 'status',
            invoiceDate: 'entityDate',
            dueDate: 'dueDate',
            total: 'total',
            balance: 'total', // Note: balance not in API, use total as fallback
            customerName: 'soldToCustomerName', // Not available yet
            manufacturerName: 'factoryName', // Not available yet
          };
          return fieldMap[state.sortField] || 'entityDate';
        })(),
        direction: state.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      }
    : undefined;

  // Excel export hook
  // Convert activeSort to sorting array format for useEntityExport
  const sorting = activeSort ? [{
    columnName: activeSort.columnName,
    direction: activeSort.direction,
  }] : undefined;

  const { context: exportContext } = useEntityExport({
    data: state.allInvoicesData as unknown as Record<string, unknown>[],
    activeFilters: state.activeFilters,
    columnFilters: state.columnFilters,
    quickDatePreset: state.quickDatePreset,
    quickDateField: state.quickDateField,
    sorting,
    searchQuery: state.searchQuery,
    config: {
      entityType: 'invoices',
      columns: INVOICE_TABLE_COLUMNS,
      getQuickDateRange: (preset: string) => getQuickDateRange(preset as QuickDatePreset),
      reportTitle: 'Invoices Export',
    },
  });

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedInvoice ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Morphing Icon Target - Receipt Slide Animation */}
              <HeaderIconAnimation
                isReceivingAnimation={isReceivingAnimation}
                animationStyle="receipt-slide"
                headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
              >
                {iconMap['invoices']}
              </HeaderIconAnimation>
              <div className="overflow-hidden">
                <motion.h1
                  className="text-2xl font-semibold text-[var(--foreground)]"
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
                >
                  Invoices
                </motion.h1>
                <motion.p
                  className="text-sm text-[var(--muted-foreground)] mt-1"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
                >
                  Manage invoices and track payments
                  {' • '}
                  {state.searchQuery.length >= 2
                    ? `${state.filteredInvoices.length} results for "${state.searchQuery}"`
                    : `Showing ${state.filteredInvoices.length} of ${state.totalCount} invoices`}
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
            >
              {/* Search Input */}
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M13 13l4 4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={state.searchQuery}
                  onChange={(e) => state.setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)]"
                />
                {state.isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
                onSortChange={state.handleSortChange}
                activeSort={activeSort}
              />

              <SaveViewButton
                onSave={handleSaveView}
                onClear={handleClearView}
                getCurrentViewState={getCurrentViewState}
                hasSavedView={hasSavedView}
                isSaving={isSettingsLoading}
              />

              <button
                onClick={() => state.setShowCreateModal(true)}
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
                New Invoice
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
            />
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {state.selectedCount > 0 && (
          <div className="px-6 py-2 bg-white border-b border-gray-200">
            <BulkActionsToolbar
              entityType="INVOICES"
              selectedCount={state.selectedCount}
              totalCount={state.totalCount}
              loadedCount={state.filteredInvoices.length}
              selectAllMode={state.selectAllMode}
              onClearSelection={state.clearSelection}
              onDelete={() => state.setShowBulkDeleteModal(true)}
            />
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading invoices</p>
              <button
                onClick={() => state.refetch()}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Invoices Table with infinite scroll */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <InvoicesTable
            filteredInvoices={state.filteredInvoices}
            isLoading={state.isLoading}
            selectedInvoiceIds={state.selectedInvoiceIds}
            toggleInvoiceSelection={state.toggleInvoiceSelection}
            selectAllInvoices={state.selectAllInvoices}
            clearSelection={state.clearSelection}
            areAllEligibleSelected={state.areAllEligibleSelected}
            isItemSelected={state.isItemSelected}
            isAllSelected={state.isAllSelected}
            isPartiallySelected={state.isPartiallySelected}
            handleSelectAll={state.handleSelectAll}
            handleSelectOne={state.handleSelectOne}
            onColumnFiltersChange={state.handleColumnFiltersChange}
            filterOptions={state.invoiceFilterOptionsWithValues}
            columnFilters={state.columnFilters}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={state.bulkDelete}
            setSelectedInvoice={state.setSelectedInvoice}
            hasNextPage={state.hasNextPage}
            isFetchingNextPage={state.isFetchingNextPage}
            fetchNextPage={state.fetchNextPage}
            searchQuery={state.searchQuery}
          />

          {/* Empty State - shown outside table when no data */}
          {!state.isLoading && state.filteredInvoices.length === 0 && (
            <InvoicesEmptyState />
          )}

          {/* Loading more indicator */}
          {state.isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
              <span className="ml-2 text-sm text-[var(--muted-foreground)]">
                Loading more...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {state.selectedInvoice && (
        <InvoiceDetailPanel
          invoice={state.selectedInvoice}
          onClose={() => state.setSelectedInvoice(null)}
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
          onRecordPayment={() => {
            state.setShowPaymentModal(true);
          }}
          onCreateCredit={() => {
            // TODO: Implement create credit functionality
            console.log('Create Credit clicked');
          }}
          onPrint={() => {
            // TODO: Implement print functionality
            console.log('Print clicked');
          }}
        />
      )}

      {/* Record Payment Modal */}
      {state.showPaymentModal && state.selectedInvoice && (
        <RecordPaymentModal
          invoice={state.selectedInvoice}
          onClose={() => state.setShowPaymentModal(false)}
          onSave={(updatedInvoice) => {
            state.setInvoices(
              state.invoices.map((inv) =>
                inv.id === updatedInvoice.id ? updatedInvoice : inv
              )
            );
            state.setSelectedInvoice(updatedInvoice);
            state.setShowPaymentModal(false);
          }}
        />
      )}

      {/* Create Invoice Modal */}
      {state.showCreateModal && (
        <CreateInvoiceModal
          onClose={() => state.setShowCreateModal(false)}
          onSave={(newInvoice) => {
            state.setInvoices([newInvoice, ...state.invoices]);
            state.setShowCreateModal(false);
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={state.showBulkDeleteModal}
        entityType="INVOICES"
        selectedCount={state.selectedCount}
        getAllSelectedIds={state.getAllSelectedIds}
        onClose={() => state.setShowBulkDeleteModal(false)}
        onSuccess={state.handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['invoices']]}
      />
    </main>
  );
}

