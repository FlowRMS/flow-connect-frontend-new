/**
 * OrdersListContent Component
 * Main container for the orders list (refactored version)
 *
 * This is a work in progress - showing table functionality
 * Sidebar and modals will be added in next steps
 */

'use client';

import React from 'react';
import AdvancedFilters from '@/components/AdvancedFilters';
import { useOrdersListState } from './hooks/useOrdersListState';
import { getOrderFilterOptions } from './config/filterConfig';
import { OrdersTable } from './components/table/OrdersTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { OrderDetailPanel } from './components/sidebar/OrderDetailPanel';
import {
  CreateOrderModal,
  CreditModal,
  AcknowledgementModal,
} from './components/modals';

export default function OrdersListContent() {
  const state = useOrdersListState();

  const filterOptions = getOrderFilterOptions();

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedOrder ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Orders (Refactored)
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage sales orders and track fulfillment
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
                New Order
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

        {/* Orders Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <OrdersTable
            filteredOrders={state.filteredOrders}
            selectedOrderIds={state.selectedOrderIds}
            toggleOrderSelection={state.toggleOrderSelection}
            selectAllOrders={state.selectAllOrders}
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
            uniqueCommissions={state.uniqueCommissions}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={state.bulkDelete}
            setSelectedOrder={state.setSelectedOrder}
          />
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
      <CreateOrderModal
        isOpen={state.showCreateModal}
        onClose={() => state.setShowCreateModal(false)}
        onSave={state.handleCreateOrder}
      />

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
    </main>
  );
}
