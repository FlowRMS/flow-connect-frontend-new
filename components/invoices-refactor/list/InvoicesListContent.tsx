/**
 * InvoicesListContent Component
 * Main container for the invoices list (refactored version)
 */

'use client';

import React from 'react';
import AdvancedFilters from '@/components/AdvancedFilters';
import { useInvoicesListState } from './hooks/useInvoicesListState';
import { getInvoiceFilterOptions } from './config/filterConfig';
import { InvoicesTable } from './components/table/InvoicesTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { InvoiceDetailPanel } from './components/sidebar/InvoiceDetailPanel';
import {
  RecordPaymentModal,
  CreateInvoiceModal,
} from './components/modals';

export default function InvoicesListContent() {
  const state = useInvoicesListState();

  const filterOptions = getInvoiceFilterOptions();

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedInvoice ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Invoices (Refactored)
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage invoices and track payments
              </p>
            </div>
            <div className="flex items-center gap-3">
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
            </div>
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
        </div>

        {/* Invoices Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <InvoicesTable
            filteredInvoices={state.filteredInvoices}
            selectedInvoiceIds={state.selectedInvoiceIds}
            toggleInvoiceSelection={state.toggleInvoiceSelection}
            selectAllInvoices={state.selectAllInvoices}
            clearSelection={state.clearSelection}
            areAllEligibleSelected={state.areAllEligibleSelected}
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
    </main>
  );
}

