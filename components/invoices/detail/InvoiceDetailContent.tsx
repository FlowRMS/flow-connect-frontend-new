/**
 * InvoiceDetailContent Component
 * Main container for invoice detail
 * Uses real API data and supports order selection for pre-population
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useInvoiceDetailState, useInvoiceLineItemsTable } from './hooks';
import { HeaderTopBar, PricingSummaryBar, InvoiceDetailsFields } from './components/header';
import { LineItemsTable } from './components/line-items';
import {
  CreditsTab,
  NotesTab,
  TasksTab,
  ActivityTab,
  LinkedObjectsTab,
  SettingsTab,
} from './components/tabs';
import { FilesTab } from '@/components/shared/FilesTab';
import {
  OutsideRepSplitsModal,
  InsideRepSplitsModal,
} from './components/modals/header';
import { WarehouseConversionModal } from './components/modals/utility';
import { AdditionalDetailsModal } from './components/modals/line-items';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from './constants';
import { getTabsConfig } from './config/tabsConfig';
import { isOverdue } from './utils';
import { mockOrders, mockChecks } from '@/lib/data/rms-mock';
import type { ColumnKey, RepSplit, InvoiceLineItem } from './types';
import type { OrderLineItem } from '@/lib/types/rms';

interface InvoiceDetailContentProps {
  invoiceId: string;
  initialOrderId?: string;
}

export default function InvoiceDetailContent({ invoiceId, initialOrderId }: InvoiceDetailContentProps) {
  const router = useRouter();
  const state = useInvoiceDetailState({ invoiceId, initialOrderId });

  // Line items table hook - must be called before any early returns to respect Rules of Hooks
  const tableHook = useInvoiceLineItemsTable({
    visibleColumns: state?.visibleColumns ?? new Set(DEFAULT_VISIBLE_COLUMNS),
    setVisibleColumns: state?.setVisibleColumns ?? (() => {}),
    selectedLineItems: state?.selectedLineItems ?? new Set(),
    lineItemsCount: state?.invoice?.lineItems?.length ?? 0,
    onSelectAll: state?.selectAllLineItems,
    onClearSelection: state?.clearLineItemSelection,
  });

  // Loading state
  if (state?.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state?.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Invoice
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            {state.error instanceof Error ? state.error.message : 'An error occurred'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => state.refetch?.()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/invoices')}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state || !state.invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Invoice Not Found
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            The invoice with ID "{invoiceId}" could not be found.
          </p>
          <button
            onClick={() => router.push('/invoices')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleMakeWarehouseOrder = () => {
    if (!state.invoice) return;

    const productsInfo = state.invoice.lineItems.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      isAlreadyWarehouse: item.isWarehouseConsignment ?? false,
    }));

    const nonWarehouseProducts = productsInfo.filter((p) => !p.isAlreadyWarehouse);

    if (nonWarehouseProducts.length > 0) {
      state.setProductsToConvert(productsInfo);
      state.setWarehouseConversionMode('all');
      state.setShowWarehouseConversionModal(true);
    } else {
      alert('All products are already marked as warehouse products.');
    }
    state.setShowActionsDropdown(false);
  };

  const handleGeneratePDF = () => {
    alert('Generate PDF');
  };

  const handleSave = async () => {
    const success = await state.saveInvoice();
    if (success) {
      alert('Invoice saved successfully');
      if (state.isCreateMode) {
        router.push('/invoices');
      }
    } else {
      alert('Failed to save invoice');
    }
  };

  const handleSaveAsNew = () => {
    const newVersion = Math.max(...state.availableVersions.map((v) => v.version)) + 1;
    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    state.setAvailableVersions([
      ...state.availableVersions.map((v) => ({ ...v, isLatest: false })),
      { version: newVersion, date: today, isLatest: true },
    ]);
    state.setCurrentVersion(newVersion);
    alert(`Saved as version ${newVersion}`);
  };

  const handleBulkConvertToWarehouse = () => {
    if (!state.invoice || state.selectedLineItems.size === 0) return;

    const selectedItems = state.invoice.lineItems.filter((item) =>
      state.selectedLineItems.has(item.id)
    );
    const productsInfo = selectedItems.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      isAlreadyWarehouse: item.isWarehouseConsignment ?? false,
    }));

    const nonWarehouseProducts = productsInfo.filter((p) => !p.isAlreadyWarehouse);

    if (nonWarehouseProducts.length > 0) {
      state.setProductsToConvert(productsInfo);
      state.setWarehouseConversionMode('selected');
      state.setShowWarehouseConversionModal(true);
    } else {
      alert('All selected products are already marked as warehouse products.');
    }
  };

  const handleConfirmWarehouseConversion = () => {
    if (!state.invoice) return;

    // Get IDs to convert
    const idsToConvert = state.productsToConvert
      .filter((p) => !p.isAlreadyWarehouse)
      .map((p) => p.id);

    // Update each line item that needs conversion
    idsToConvert.forEach(id => {
      state.updateLineItem(id, {
        isWarehouseConsignment: true,
        inventoryOnHand: 0, // Default to 0, would be fetched from actual inventory
      });
    });

    state.setShowWarehouseConversionModal(false);
    state.setProductsToConvert([]);
    state.clearLineItemSelection();
  };

  const handleSaveOutsideRepSplits = (splits: RepSplit[]) => {
    state.setOutsideRepSplits(splits);
    state.setSplitOutsideCommission(splits.length > 0);
  };

  const handleCancelOutsideRepSplits = () => {
    state.setSplitOutsideCommission(false);
    state.setOutsideRepSplits([]);
  };

  const handleSaveInsideRepSplits = (splits: RepSplit[]) => {
    state.setInsideRepSplits(splits);
    state.setSplitInsideCommission(splits.length > 0);
  };

  const handleCancelInsideRepSplits = () => {
    state.setSplitInsideCommission(false);
    state.setInsideRepSplits([]);
  };

  return (
    <main className="flex flex-col h-screen bg-[var(--background)]">
      {/* Header Top Bar */}
      <HeaderTopBar
        invoice={state.invoice}
        showActionsDropdown={state.showActionsDropdown}
        setShowActionsDropdown={state.setShowActionsDropdown}
        showStatusDropdown={state.showStatusDropdown}
        setShowStatusDropdown={state.setShowStatusDropdown}
        showVersionDropdown={state.showVersionDropdown}
        setShowVersionDropdown={state.setShowVersionDropdown}
        showViewModeDropdown={state.showViewModeDropdown}
        setShowViewModeDropdown={state.setShowViewModeDropdown}
        showSaveDropdown={state.showSaveDropdown}
        setShowSaveDropdown={state.setShowSaveDropdown}
        currentVersion={state.currentVersion}
        setCurrentVersion={state.setCurrentVersion}
        availableVersions={state.availableVersions}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        setVisibleColumns={state.setVisibleColumns}
        updateInvoiceStatus={state.updateInvoiceStatus}
        handleMakeWarehouseOrder={handleMakeWarehouseOrder}
        handleGeneratePDF={handleGeneratePDF}
        handleSave={handleSave}
        handleSaveAsNew={handleSaveAsNew}
      />

      {/* Pricing Summary Bar */}
      <PricingSummaryBar
        viewMode={state.viewMode}
        totals={state.totals}
      />

      {/* Invoice Details Fields */}
      <InvoiceDetailsFields
        invoice={state.invoice}
        showHeaderFields={state.showHeaderFields}
        toggleHeaderFields={() => state.setShowHeaderFields(!state.showHeaderFields)}
        isConnectedToOrder={state.isConnectedToOrder}
        poNumber={state.poNumber}
        setPoNumber={state.setPoNumber}
        invoiceOutsideRep={state.invoiceOutsideRep}
        setInvoiceOutsideRep={state.setInvoiceOutsideRep}
        splitOutsideCommission={state.splitOutsideCommission}
        setSplitOutsideCommission={state.setSplitOutsideCommission}
        outsideRepSplits={state.outsideRepSplits}
        setOutsideRepSplits={state.setOutsideRepSplits}
        openOutsideRepModal={() => state.setShowOutsideRepSplitsModal(true)}
        invoiceInsideRep={state.invoiceInsideRep}
        setInvoiceInsideRep={state.setInvoiceInsideRep}
        splitInsideCommission={state.splitInsideCommission}
        setSplitInsideCommission={state.setSplitInsideCommission}
        insideRepSplits={state.insideRepSplits}
        setInsideRepSplits={state.setInsideRepSplits}
        openInsideRepModal={() => state.setShowInsideRepSplitsModal(true)}
        onOrderSelect={state.handleOrderSelect}
        onUpdateInvoice={state.updateInvoice}
        isCreateMode={state.isCreateMode}
        isPaid={state.invoice.status === 'paid'}
      />

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {getTabsConfig(state.invoice.lineItems.length, state.isCreateMode).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && !tab.comingSoon && state.setActiveTab(tab.id)}
                  disabled={tab.disabled || tab.comingSoon}
                  title={tab.disabled ? tab.disabledReason : tab.comingSoon ? 'Coming soon' : undefined}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab.disabled || tab.comingSoon
                      ? 'border-transparent text-gray-300 cursor-not-allowed'
                      : state.activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.comingSoon && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                      SOON
                    </span>
                  )}
                  {tab.id === 'credits' &&
                    !tab.disabled &&
                    Object.keys(state.lineItemCredits).length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {Object.keys(state.lineItemCredits).length}
                      </span>
                    )}
                  {tab.id !== 'credits' &&
                    tab.count !== undefined &&
                    tab.count > 0 && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab.disabled ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {tab.count}
                      </span>
                    )}
                </button>
              ))}
              {state.isCreateMode && (
                <span className="ml-auto text-xs text-[var(--muted-foreground)] italic pr-2">
                  Some tabs will unlock after saving
                </span>
              )}
            </div>

            {/* View Controls - on tab row */}
            {state.activeTab === 'line-items' && (
              <div className="flex items-center gap-3 pb-2">
                {/* Custom Button */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                    <path d="M3 8h14M8 8v9" />
                  </svg>
                  Custom
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M6 8l4 4 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Sections Button */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="14" height="4" rx="1" />
                    <rect x="3" y="10" width="14" height="7" rx="1" />
                  </svg>
                  Sections
                </button>

                {/* Columns Button */}
                <div className="relative">
                  <button
                    onClick={() =>
                      tableHook.setShowColumnsMenu(!tableHook.showColumnsMenu)
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M4 6h12M4 10h12M4 14h12"
                        strokeLinecap="round"
                      />
                    </svg>
                    Columns
                    <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">
                      {state.visibleColumns.size}
                    </span>
                  </button>
                  {tableHook.showColumnsMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => tableHook.setShowColumnsMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                        {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map(
                          (col) => (
                            <label
                              key={col}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--muted)] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={state.visibleColumns.has(col)}
                                onChange={() => tableHook.toggleColumn(col)}
                                className="accent-[var(--primary)]"
                              />
                              <span className="text-sm">{COLUMN_LABELS[col]}</span>
                            </label>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {state.activeTab === 'line-items' && (
            <div className="flex-1 overflow-auto pb-32">
              <LineItemsTable
                invoice={state.invoice}
                selectedLineItems={state.selectedLineItems}
                onToggleLineItemSelection={state.toggleLineItemSelection}
                onToggleAllLineItems={tableHook.toggleAllLineItems}
                onClearSelection={state.clearLineItemSelection}
                visibleColumns={state.visibleColumns}
                viewMode={state.viewMode}
                lineItemCredits={state.lineItemCredits}
                onConvertToWarehouse={handleBulkConvertToWarehouse}
                onShowOrderTooltip={tableHook.showOrderTooltip}
                mockOrders={mockOrders}
                mockChecks={mockChecks}
                onAddLine={state.addLineItem}
                onUpdateLineItem={state.updateLineItem}
                onDeleteLineItem={state.deleteLineItem}
                onOpenAdditionalDetails={state.openAdditionalDetails}
                isEditable={state.invoice.status !== 'paid'}
                factoryId={state.invoice.manufacturerId}
              />
            </div>
          )}

          {/* Files Tab */}
          {state.activeTab === 'files' && (
            <div className="flex-1 overflow-auto">
              <FilesTab
                entityId={invoiceId}
                entityType="INVOICE"
              />
            </div>
          )}

          {/* Credits Tab */}
          {state.activeTab === 'credits' && (
            <div className="flex-1 overflow-auto">
              <CreditsTab
                invoice={state.invoice}
                lineItemCredits={state.lineItemCredits}
              />
            </div>
          )}

          {/* Notes Tab */}
          {state.activeTab === 'notes' && (
            <div className="flex-1 overflow-auto">
              <NotesTab invoiceId={invoiceId} />
            </div>
          )}

          {/* Tasks Tab */}
          {state.activeTab === 'tasks' && (
            <div className="flex-1 overflow-auto">
              <TasksTab invoiceId={invoiceId} />
            </div>
          )}

          {/* Activity Tab */}
          {state.activeTab === 'activity' && (
            <div className="flex-1 overflow-auto">
              <ActivityTab />
            </div>
          )}

          {/* Linked Objects Tab */}
          {state.activeTab === 'linked-objects' && (
            <div className="flex-1 overflow-auto">
              <LinkedObjectsTab invoiceId={invoiceId} />
            </div>
          )}

          {/* Settings Tab */}
          {state.activeTab === 'settings' && (
            <div className="flex-1 overflow-auto">
              <SettingsTab />
            </div>
          )}
        </div>
      </div>

      {/* Order Tooltip - rendered via Portal to document.body to avoid all overflow clipping issues */}
      {tableHook.portalMounted &&
        tableHook.orderTooltip.visible &&
        tableHook.orderTooltip.orders.length > 0 &&
        createPortal(
          <div
            className="fixed z-[99999] bg-gray-900 text-white text-sm rounded-lg shadow-xl px-4 py-3 min-w-[220px] max-w-[320px] pointer-events-none"
            style={{
              left: Math.min(
                tableHook.orderTooltip.x,
                typeof window !== 'undefined'
                  ? window.innerWidth - 340
                  : tableHook.orderTooltip.x
              ),
              top: tableHook.orderTooltip.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="font-semibold mb-2 text-base text-blue-400">
              {tableHook.orderTooltip.orders.length === 1
                ? 'Order Details'
                : 'Linked Orders'}
            </div>
            {tableHook.orderTooltip.orders.map((ord) => {
              const lineItems = ord.lineItems.filter(
                (li: OrderLineItem) => !li.isCredit && li.partNumber !== 'FREIGHT'
              );
              return (
                <div
                  key={ord.id}
                  className="mb-2 last:mb-0 pb-2 last:pb-0 border-b border-gray-700 last:border-0"
                >
                  <div className="font-medium text-blue-400">
                    {ord.orderNumber}
                  </div>
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Total:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(ord.total)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Status:</span>
                      <span className="font-medium">
                        {ord.status.charAt(0).toUpperCase() +
                          ord.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Line Items:</span>
                      <span className="font-medium">{lineItems.length}</span>
                    </div>
                    {lineItems.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">
                          Line Items:
                        </div>
                        {lineItems.slice(0, 4).map((li: OrderLineItem) => (
                          <div
                            key={li.id}
                            className="text-xs flex justify-between gap-2"
                          >
                            <span className="truncate max-w-[150px]">
                              {li.partNumber}
                            </span>
                            <span className="text-gray-400">
                              x{li.quantity}
                            </span>
                          </div>
                        ))}
                        {lineItems.length > 4 && (
                          <div className="text-xs text-gray-400 mt-1">
                            +{lineItems.length - 4} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>,
          document.body
        )}

      {/* Modals */}
      <OutsideRepSplitsModal
        isOpen={state.showOutsideRepSplitsModal}
        onClose={() => state.setShowOutsideRepSplitsModal(false)}
        splits={state.outsideRepSplits}
        onSave={handleSaveOutsideRepSplits}
        onCancel={handleCancelOutsideRepSplits}
      />

      <InsideRepSplitsModal
        isOpen={state.showInsideRepSplitsModal}
        onClose={() => state.setShowInsideRepSplitsModal(false)}
        splits={state.insideRepSplits}
        onSave={handleSaveInsideRepSplits}
        onCancel={handleCancelInsideRepSplits}
      />

      <WarehouseConversionModal
        isOpen={state.showWarehouseConversionModal}
        onClose={() => {
          state.setShowWarehouseConversionModal(false);
          state.setProductsToConvert([]);
        }}
        mode={state.warehouseConversionMode}
        productsToConvert={state.productsToConvert}
        onConfirm={handleConfirmWarehouseConversion}
      />

      {/* Additional Details Modal for line items */}
      <AdditionalDetailsModal
        isOpen={state.showAdditionalDetailsModal}
        onClose={() => state.setShowAdditionalDetailsModal(false)}
        lineItem={state.selectedLineItemForDetails}
        onSave={state.saveAdditionalDetails}
      />
    </main>
  );
}

