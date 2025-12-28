/**
 * OrderDetailContent Component
 * Main container for order detail
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
  AdditionalDetailsModal,
} from './components/modals';
import { getLinkedInvoicesForLineItem, getLinkedChecksForInvoice, getLineShipStatus } from './utils';
import { mockInvoices, mockChecks } from '@/lib/data/rms-mock';
import { orderToasts } from '@/components/lib/toast';

interface OrderDetailContentProps {
  orderId: string;
}

export default function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const router = useRouter();
  const state = useOrderDetailState({ orderId });

  // Loading state
  if (state?.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state?.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Error Loading Order</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">{state.error.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => state.refetch()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only show "not found" for edit mode when order is missing
  if (!state || (!state.isCreateMode && !state.order)) {
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
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // For create mode, we have an empty order from the hook
  const isCreateMode = state.isCreateMode;

  // At this point, order should be defined (either from API or create mode)
  // Use non-null assertion since we've handled null case above
  const order = state.order!;

  const handleSave = async () => {
    if (!order) return;

    try {
      // Helper to check if ID is a valid UUID (from API)
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      // Build inside reps array from insideRepSplits (supports multiple reps with split commission)
      // If split commission is enabled, use all reps from insideRepSplits; otherwise use primary insideRepId
      let insideReps: { userId: string; splitRate: string; position: number }[] | undefined;
      if (state.splitInsideCommission && state.insideRepSplits.length > 0) {
        // Use all inside reps from split modal
        insideReps = state.insideRepSplits.map((rep, idx) => ({
          userId: rep.repId,
          splitRate: String(rep.percentage),
          position: idx,
        }));
      } else if (state.orderInsideRep || order.insideRepId) {
        // Single inside rep
        insideReps = [{
          userId: state.orderInsideRep || order.insideRepId || '',
          splitRate: '100',
          position: 0,
        }];
      }

      // Build outside reps array from outsideRepSplits (supports multiple reps with split commission)
      // If split commission is enabled, use all reps from outsideRepSplits; otherwise use primary outsideRepId
      let outsideRepSplitRates: { userId: string; splitRate: string; position: number }[] | undefined;
      if (state.splitOutsideCommission && state.outsideRepSplits.length > 0) {
        // Use all outside reps from split modal
        outsideRepSplitRates = state.outsideRepSplits.map((rep, idx) => ({
          userId: rep.repId,
          splitRate: String(rep.percentage),
          position: idx,
        }));
      } else if (state.orderOutsideRep || (order as any).outsideRepId) {
        // Single outside rep
        outsideRepSplitRates = [{
          userId: state.orderOutsideRep || (order as any).outsideRepId || '',
          splitRate: '100',
          position: 0,
        }];
      }

      // Get order-level endUserId (used when not in per-line mode)
      const orderEndUserId = (order as any).endUserId;

      // Build details with proper splitRates for outside rep
      const buildDetails = (includeId: boolean) => (order.lineItems || []).map((item, index) => {
        const detail: any = {
          itemNumber: item.lineNumber || index + 1,
          quantity: String(item.quantity || 0),
          unitPrice: String(item.unitPrice || 0),
          productId: item.productId || undefined,
          productNameAdhoc: item.partNumber || undefined,
          productDescriptionAdhoc: item.description || undefined,
          commissionRate: String((item.commissionRate || 0) * 100), // Convert decimal to percent for API
          divisionFactor: item.divisor ? String(item.divisor) : undefined,
          // Include outside rep splitRates on each line item
          splitRates: outsideRepSplitRates,
        };
        // Get endUserId: use line-item level if set, otherwise fall back to order-level
        const lineEndUserId = (item as any).endUserId;
        const endUserIdToUse = (lineEndUserId && isValidUUID(lineEndUserId))
          ? lineEndUserId
          : (orderEndUserId && isValidUUID(orderEndUserId) ? orderEndUserId : undefined);

        if (endUserIdToUse) {
          detail.endUserId = endUserIdToUse;
        }
        // Only include id for existing items (update mode)
        if (includeId && item.id && isValidUUID(item.id)) {
          detail.id = item.id;
        }
        return detail;
      });

      if (isCreateMode) {
        // Create new order
        const createInput = {
          orderNumber: order.orderNumber || `ORD-${Date.now()}`,
          entityDate: order.orderDate || new Date().toISOString().split('T')[0],
          soldToCustomerId: order.customerId || '',
          billToCustomerId: (order as any).billToCustomerId || undefined,
          factoryId: order.manufacturerId || undefined,
          dueDate: order.dueDate || undefined,
          shipDate: order.shipDate || undefined,
          projectedShipDate: order.requestedShipDate || undefined,
          quoteId: order.quoteId || undefined,
          factSoNumber: order.factorySoNumber || undefined,
          freightTerms: (order as any).freightTerms || undefined,
          shippingTerms: (order as any).shippingTerms || undefined,
          markNumber: (order as any).markNumber || undefined,
          orderType: ((order as any).orderType || 'NORMAL') as 'NORMAL' | 'BLANKET' | 'RELEASE',
          creationType: 'MANUAL' as const,
          published: (order as any).published !== false,
          insideReps,
          details: buildDetails(false),
        };

        console.log('Creating order with input:', createInput);
        const result = await state.createOrderMutation.mutateAsync(createInput);
        console.log('Order created:', result);
        orderToasts.createSuccess(result.orderNumber || createInput.orderNumber);
        router.push('/orders');
      } else {
        // Update existing order
        if (state.updateOrderMutation) {
          const updateInput = {
            id: order.id,
            orderNumber: order.orderNumber,
            entityDate: order.orderDate || new Date().toISOString().split('T')[0],
            soldToCustomerId: order.customerId || '',
            billToCustomerId: (order as any).billToCustomerId || undefined,
            factoryId: order.manufacturerId || undefined,
            dueDate: order.dueDate || undefined,
            shipDate: order.shipDate || undefined,
            projectedShipDate: order.requestedShipDate || undefined,
            quoteId: order.quoteId || undefined,
            factSoNumber: order.factorySoNumber || undefined,
            freightTerms: (order as any).freightTerms || undefined,
            shippingTerms: (order as any).shippingTerms || undefined,
            markNumber: (order as any).markNumber || undefined,
            orderType: ((order as any).orderType || 'NORMAL') as 'NORMAL' | 'BLANKET' | 'RELEASE',
            creationType: 'MANUAL' as const,
            published: (order as any).published !== false,
            insideReps,
            details: buildDetails(true),
          };

          await state.updateOrderMutation.mutateAsync(updateInput);
          orderToasts.updateSuccess(order.orderNumber);
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isCreateMode) {
        orderToasts.createError(errorMessage);
      } else {
        orderToasts.updateError(errorMessage);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this order?')) {
      alert('Order deleted');
      router.push('/orders');
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
        order={order}
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
        onUpdateOrder={state.updateLocalOrder}
        isCreateMode={isCreateMode}
        showEndUserPerLine={state.showEndUserPerLine}
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
              { id: 'line-items', label: 'Line Items', count: (order.lineItems || []).length },
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
              order={order}
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
              onUpdateLineItems={state.updateLineItems}
              showEndUserPerLine={state.showEndUserPerLine}
              onOpenAdditionalDetails={state.openAdditionalDetails}
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
        order={order}
        onSubmit={() => {
          alert('Credit added successfully');
          state.closeCreditModal();
          clearSelection();
        }}
      />

      <LineAcknowledgementModal
        isOpen={state.showLineAcknowledgementModal}
        onClose={state.closeAcknowledgementModal}
        order={order}
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

      {/* Additional Details Modal (3-dots menu) */}
      <AdditionalDetailsModal
        isOpen={state.showAdditionalDetailsModal}
        onClose={state.closeAdditionalDetails}
        lineItem={state.additionalDetailsLineItem}
        onSave={state.saveAdditionalDetails}
        showEndUserPerLine={state.showEndUserPerLine}
      />
    </main>
  );
}
