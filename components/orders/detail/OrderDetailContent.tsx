/**
 * OrderDetailContent Component
 * Main container for order detail (refactored version)
 *
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOrderDetailState } from './hooks/useOrderDetailState';
import { OrderDetailHeader } from './components/header';
import { LineItemsTable } from './components/line-items';
import { NotesTab, TasksTab, ActivityTab, CreditsTab, AcknowledgementsTab, LinkedObjectsTab, SettingsTab } from './components/tabs';
import {
  SetOverageModal,
  SetEndUserModal,
  SetOutsideRepSplitsModal,
  LineCreditModal,
  LineAcknowledgementModal,
  SectionsModal,
  ColumnsModal,
  QuoteLookupModal,
  OutsideRepSplitsModal,
  InsideRepSplitsModal,
  WarehouseConversionModal,
  FulfillmentRequestModal,
} from './components/modals';
import { getLinkedInvoicesForLineItem, getLinkedChecksForInvoice, getLineShipStatus } from './utils';
import { mockInvoices, mockChecks } from '@/lib/data/rms-mock';

interface OrderDetailContentProps {
  orderId: string;
}

export default function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const router = useRouter();
  const state = useOrderDetailState({ orderId });

  if (!state || !state.order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Order Not Found
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            The order with ID "{orderId}" could not be found.
          </p>
          <button
            onClick={() => router.push('/orders-refactor')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    alert('Order saved successfully');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this order?')) {
      alert('Order deleted');
      router.push('/orders-refactor');
    }
  };

  const clearSelection = () => {
    state.clearLineItemSelection();
  };

  // Bulk action handlers (placeholders for now)
  const handleSetOverage = () => {
    state.openOverageModal();
  };

  const handleLockOverage = () => {
    alert('Overage locked for selected items');
    clearSelection();
  };

  const handleUnlockOverage = () => {
    alert('Overage unlocked for selected items');
    clearSelection();
  };

  const handleSetEndUser = () => {
    state.openEndUserModal();
  };

  const handleSetOutsideRepSplits = () => {
    state.openOutsideRepSplitsModal();
  };

  const handleConvertToWarehouse = () => {
    state.openWarehouseConversionModal('selected');
  };

  const handleAddCredit = () => {
    state.openCreditModal();
  };

  const handleAddAcknowledgement = () => {
    state.openAcknowledgementModal();
  };

  const handleDeleteLines = () => {
    if (confirm(`Are you sure you want to delete ${state.selectedLineItems.size} line item(s)?`)) {
      alert('Lines deleted');
      clearSelection();
    }
  };

  const handleToggleFreightLine = () => {
    // This will be implemented when we connect to real state management
    // For now, just alert
    alert(state.hasFreightLine ? 'Freight line would be removed' : 'Freight line would be added');
  };

  return (
    <main className="flex flex-col h-screen bg-[var(--background)]">
      {/* Header */}
      <OrderDetailHeader
        order={state.order}
        showHeaderFields={state.showHeaderFields}
        toggleHeaderFields={state.toggleHeaderFields}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        showViewModeDropdown={state.showViewModeDropdown}
        setShowViewModeDropdown={state.setShowViewModeDropdown}
        showSaveDropdown={state.showSaveDropdown}
        setShowSaveDropdown={state.setShowSaveDropdown}
        onSave={handleSave}
        onDelete={handleDelete}
        orderOutsideRep={state.orderOutsideRep}
        setOrderOutsideRep={state.setOrderOutsideRep}
        splitOutsideCommission={state.splitOutsideCommission}
        setSplitOutsideCommission={state.setSplitOutsideCommission}
        outsideRepSplits={state.outsideRepSplits}
        setOutsideRepSplits={state.setOutsideRepSplits}
        openOutsideRepModal={state.openOutsideRepModal}
        orderInsideRep={state.orderInsideRep}
        setOrderInsideRep={state.setOrderInsideRep}
        splitInsideCommission={state.splitInsideCommission}
        setSplitInsideCommission={state.setSplitInsideCommission}
        insideRepSplits={state.insideRepSplits}
        setInsideRepSplits={state.setInsideRepSplits}
        openInsideRepModal={state.openInsideRepModal}
        showActionsDropdown={state.showActionsDropdown}
        setShowActionsDropdown={state.setShowActionsDropdown}
        showStatusDropdown={state.showStatusDropdown}
        setShowStatusDropdown={state.setShowStatusDropdown}
        showVersionDropdown={state.showVersionDropdown}
        setShowVersionDropdown={state.setShowVersionDropdown}
        currentVersion={state.currentVersion}
        setCurrentVersion={state.setCurrentVersion}
        availableVersions={state.availableVersions}
        setAvailableVersions={state.setAvailableVersions}
        setVisibleColumns={state.setVisibleColumns}
        setActiveView={state.setActiveView}
        updateOrderStatus={state.updateOrderStatus}
        setShowQuoteLookupModal={state.setShowQuoteLookupModal}
      />

      {/* Main Content Area with Tabs */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white pt-4 px-4 -mx-6 -mt-6">
          <div className="flex gap-1">
            {[
              { id: 'line-items', label: 'Line Items', count: state.order.lineItems.length },
              { id: 'credits', label: 'Credits' },
              { id: 'acknowledgements', label: 'Acknowledgements' },
              { id: 'notes', label: 'Notes' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'activity', label: 'Activity' },
              { id: 'linked-objects', label: 'Linked Objects' },
              { id: 'settings', label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => state.setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  state.activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* View Controls - only show when Line Items tab is active */}
          {state.activeTab === 'line-items' && (
            <div className="flex items-center gap-3 pb-2">
              {/* Views Dropdown */}
              <div className="relative">
                <button
                  onClick={() => state.setShowViewsMenu(!state.showViewsMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M3 8h14M8 8v9"/>
                  </svg>
                  {state.savedViews.find(v => v.id === state.activeView)?.name || 'Custom'}
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {state.showViewsMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => state.setShowViewsMenu(false)} />
                    <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                      <div className="p-2 border-b border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Saved Views</p>
                      </div>
                      {state.savedViews.map(view => (
                        <button
                          key={view.id}
                          onClick={() => {
                            state.setVisibleColumns(new Set(view.columns));
                            state.setActiveView(view.id);
                            state.setShowViewsMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                            state.activeView === view.id ? 'text-[var(--primary)] font-medium' : ''
                          }`}
                        >
                          {view.name}
                          {state.activeView === view.id && (
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sections Button */}
              <button
                onClick={() => state.setShowSectionsModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  state.showSections
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] hover:bg-[var(--muted)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="14" height="4" rx="1"/>
                  <rect x="3" y="10" width="14" height="7" rx="1"/>
                </svg>
                Sections
              </button>

              {/* Columns Button */}
              <button
                onClick={() => state.openColumnsModal()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                </svg>
                Columns
                <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{state.visibleColumns.size}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {state.activeTab === 'line-items' && (
            <LineItemsTable
              order={state.order}
              selectedLineItems={state.selectedLineItems}
              onToggleLineItemSelection={state.toggleLineItemSelection}
              onToggleAllLineItems={state.selectAllLineItems}
              onClearSelection={clearSelection}
              visibleColumns={state.visibleColumns}
              viewMode={state.viewMode}
              isPinned={state.isPinned}
              getPinnedColumnStyle={state.getPinnedColumnStyle}
              lineItemAcknowledgements={state.lineItemAcknowledgements}
              lineItemCredits={state.lineItemCredits}
              getLinkedInvoicesForLineItem={getLinkedInvoicesForLineItem}
              getLinkedChecksForInvoice={getLinkedChecksForInvoice}
              getLineShipStatus={getLineShipStatus}
              mockInvoices={mockInvoices}
              mockChecks={mockChecks}
              setInvoiceTooltip={state.setInvoiceTooltip}
              onSetOverage={handleSetOverage}
              onLockOverage={handleLockOverage}
              onUnlockOverage={handleUnlockOverage}
              onSetEndUser={handleSetEndUser}
              onSetOutsideRepSplits={handleSetOutsideRepSplits}
              onConvertToWarehouse={handleConvertToWarehouse}
              onAddCredit={handleAddCredit}
              onAddAcknowledgement={handleAddAcknowledgement}
              onDeleteLines={handleDeleteLines}
            />
          )}

          {state.activeTab === 'notes' && <NotesTab />}
          {state.activeTab === 'tasks' && <TasksTab />}
          {state.activeTab === 'activity' && <ActivityTab />}
          {state.activeTab === 'credits' && <CreditsTab onAddCredit={state.openCreditModal} />}
          {state.activeTab === 'acknowledgements' && <AcknowledgementsTab onAddAcknowledgement={state.openAcknowledgementModal} />}
          {state.activeTab === 'linked-objects' && <LinkedObjectsTab />}
          {state.activeTab === 'settings' && (
            <SettingsTab
              showEndUserPerLine={state.showEndUserPerLine}
              setShowEndUserPerLine={state.setShowEndUserPerLine}
              showOutsideRepPerLine={state.showOutsideRepPerLine}
              setShowOutsideRepPerLine={state.setShowOutsideRepPerLine}
              showInsideRepPerLine={state.showInsideRepPerLine}
              setShowInsideRepPerLine={state.setShowInsideRepPerLine}
              customerPartNumberSource={state.customerPartNumberSource}
              setCustomerPartNumberSource={state.setCustomerPartNumberSource}
              hasFreightLine={state.hasFreightLine}
              onToggleFreightLine={handleToggleFreightLine}
            />
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Line Items Modals */}
      <SetOverageModal
        isOpen={state.showSetOverageModal}
        onClose={state.closeOverageModal}
        selectedCount={state.selectedLineItems.size}
        overagePercent={state.bulkOveragePercent}
        setOveragePercent={state.setBulkOveragePercent}
        onApply={() => {
          alert(`Overage set to ${state.bulkOveragePercent}%`);
          state.closeOverageModal();
          clearSelection();
        }}
      />

      <SetEndUserModal
        isOpen={state.showSetEndUserModal}
        onClose={state.closeEndUserModal}
        selectedCount={state.selectedLineItems.size}
        endUser={state.bulkEndUser}
        setEndUser={state.setBulkEndUser}
        onApply={() => {
          alert(`End user set to ${state.bulkEndUser}`);
          state.closeEndUserModal();
          clearSelection();
        }}
      />

      <SetOutsideRepSplitsModal
        isOpen={state.showSetOutsideRepSplitsModal}
        onClose={state.closeOutsideRepSplitsModal}
        selectedCount={state.selectedLineItems.size}
        outsideRep=""
        setOutsideRep={() => {}}
        splitPercentage=""
        setSplitPercentage={() => {}}
        onApply={() => {
          alert('Outside rep splits configured for selected items');
          state.closeOutsideRepSplitsModal();
          clearSelection();
        }}
      />

      <LineCreditModal
        isOpen={state.showLineCreditModal}
        onClose={state.closeCreditModal}
        order={state.order}
        onSubmit={() => {
          alert('Credit added successfully');
          state.closeCreditModal();
          clearSelection();
        }}
      />

      <LineAcknowledgementModal
        isOpen={state.showLineAcknowledgementModal}
        onClose={state.closeAcknowledgementModal}
        order={state.order}
        onSubmit={() => {
          alert('Acknowledgement added successfully');
          state.closeAcknowledgementModal();
          clearSelection();
        }}
      />

      {/* Header Modals */}
      <SectionsModal
        isOpen={state.showSectionsModal}
        onClose={() => state.setShowSectionsModal(false)}
        showSections={state.showSections}
        setShowSections={state.setShowSections}
        sectionDisplayMode={state.sectionDisplayMode}
        setSectionDisplayMode={state.setSectionDisplayMode}
      />

      <ColumnsModal
        isOpen={state.showColumnsModal}
        onClose={state.closeColumnsModal}
        visibleColumns={state.visibleColumns}
        pinnedColumns={state.pinnedColumns}
        toggleColumn={state.toggleColumn}
        togglePinColumn={state.togglePinColumn}
      />

      <QuoteLookupModal
        isOpen={state.showQuoteLookupModal}
        onClose={() => state.setShowQuoteLookupModal(false)}
        partNumber={state.quoteLookupPartNumber}
        setPartNumber={state.setQuoteLookupPartNumber}
        quoteNumber={state.quoteLookupQuoteNumber}
        setQuoteNumber={state.setQuoteLookupQuoteNumber}
        startDate={state.quoteLookupStartDate}
        setStartDate={state.setQuoteLookupStartDate}
        endDate={state.quoteLookupEndDate}
        setEndDate={state.setQuoteLookupEndDate}
        openOnly={state.quoteLookupOpenOnly}
        setOpenOnly={state.setQuoteLookupOpenOnly}
        blanketOnly={state.quoteLookupBlanketOnly}
        setBlanketOnly={state.setQuoteLookupBlanketOnly}
        onSearch={() => {
          alert('Searching for quote lines...');
        }}
      />

      <OutsideRepSplitsModal
        isOpen={state.showOutsideRepSplitsModal}
        onClose={state.closeOutsideRepModal}
        splits={state.outsideRepSplits}
        onSave={(splits) => {
          state.setOutsideRepSplits(splits);
        }}
      />

      <InsideRepSplitsModal
        isOpen={state.showInsideRepSplitsModal}
        onClose={state.closeInsideRepModal}
        splits={state.insideRepSplits}
        onSave={(splits) => {
          state.setInsideRepSplits(splits);
        }}
      />

      {/* Utility Modals */}
      <WarehouseConversionModal
        isOpen={state.showWarehouseConversionModal}
        onClose={state.closeWarehouseConversionModal}
        mode={state.warehouseConversionMode}
        productsToConvert={state.productsToConvert}
        onConfirm={() => {
          alert('Products converted to warehouse');
          state.closeWarehouseConversionModal();
        }}
      />

      <FulfillmentRequestModal
        isOpen={state.showFulfillmentRequestModal}
        onClose={state.closeFulfillmentRequestModal}
        mode={state.fulfillmentRequestMode}
        lineItems={state.lineItemsForFulfillment}
        onConfirm={() => {
          alert('Fulfillment request generated');
          state.closeFulfillmentRequestModal();
        }}
      />
    </main>
  );
}
