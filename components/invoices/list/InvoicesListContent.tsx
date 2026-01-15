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
import { useInvoicesListState } from './hooks/useInvoicesListState';
import { getInvoiceFilterOptions } from './config/filterConfig';
import { InvoicesTable } from './components/table/InvoicesTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { InvoiceDetailPanel } from './components/sidebar/InvoiceDetailPanel';
import {
  RecordPaymentModal,
  CreateInvoiceModal,
} from './components/modals';
import { BulkDeleteModal, BulkActionsToolbar } from '../../shared';

export default function InvoicesListContent() {
  const state = useInvoicesListState();

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
                  {state.totalCount > 0 && (
                    <span className="ml-2 text-[var(--muted-foreground)]">
                      ({state.totalCount} total)
                    </span>
                  )}
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
              <AdvancedFilters filterOptions={filterOptions} />
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

          {/* Quick Date Filter */}
          <QuickDateFilter
            quickDatePreset={state.quickDatePreset}
            setQuickDatePreset={state.setQuickDatePreset}
            quickDateField={state.quickDateField}
            setQuickDateField={state.setQuickDateField}
            showQuickDateFieldDropdown={state.showQuickDateFieldDropdown}
            setShowQuickDateFieldDropdown={state.setShowQuickDateFieldDropdown}
          />

          {/* Bulk Actions Toolbar */}
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

        {/* Loading State */}
        {state.isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">Loading invoices...</p>
            </div>
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
        {!state.isLoading && !state.error && (
          <div
            className="flex-1 overflow-auto p-6 pt-4"
            onScroll={state.handleScroll}
          >
            <InvoicesTable
            filteredInvoices={state.filteredInvoices}
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
            sortField={state.sortField}
            sortDirection={state.sortDirection}
            handleSort={state.handleSort}
            columnFilters={state.columnFilters}
            setColumnFilters={state.setColumnFilters}
            openFilter={state.openFilter}
            setOpenFilter={state.setOpenFilter}
            uniqueCustomers={state.uniqueCustomers}
            uniqueManufacturers={state.uniqueManufacturers}
            uniqueStatuses={state.uniqueStatuses}
            uniqueTotals={state.uniqueTotals}
            uniqueBalances={state.uniqueBalances}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={state.bulkDelete}
            setSelectedInvoice={state.setSelectedInvoice}
          />
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
        )}
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

