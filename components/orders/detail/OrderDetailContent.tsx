/**
 * OrderDetailContent Component
 * Main container for order detail
 *
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderDetailState } from './hooks/useOrderDetailState';
import { useFlowChat } from '@/contexts/FlowChatContext';
import { OrderDetailHeader } from './components/header';
import { LineItemsTable } from './components/line-items';
import { NotesTab, TasksTab, ActivityTab, CreditsTab, AdjustmentsTab, AcknowledgementsTab, LinkedObjectsTab, SettingsTab } from './components/tabs';
import { FilesTab } from '@/components/shared/FilesTab';
import {
  SetOverageModal,
  SetEndUserModal,
  SetOutsideRepSplitsModal,
  LineAcknowledgementModal,
  SectionsModal,
  ColumnsModal,
  QuoteLookupModal,
  OutsideRepSplitsModal,
  InsideRepSplitsModal,
  WarehouseConversionModal,
  FulfillmentRequestModal,
  AdditionalDetailsModal,
  CreditModal,
  CreditDetailModal,
  AdjustmentModal,
  AdjustmentDetailModal,
  AcknowledgementModal,
  AcknowledgementDetailModal,
  DeleteConfirmModal,
  CreateInvoiceFromOrderModal,
} from './components/modals';
import { DuplicateOrderModal } from '../list/components/modals/DuplicateOrderModal';
import { useDuplicateOrder } from '../api/useOrdersApi';
import { useAutoPopulateReps, RepSplitRate } from '@/components/shared/hooks/useAutoPopulateReps';
import { useCreditsState } from './hooks/useCreditsState';
import { useAdjustmentsState } from './hooks/useAdjustmentsState';
import { useAcknowledgementsState } from './hooks/useAcknowledgementsState';
import { getLinkedInvoicesForLineItem, getLinkedChecksForInvoice, getLineShipStatus } from './utils';
import { mockInvoices, mockChecks } from '@/lib/data/rms-mock';
import { orderToasts } from '@/components/lib/toast';

interface OrderDetailContentProps {
  orderId: string;
}

export default function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const router = useRouter();
  const state = useOrderDetailState({ orderId });
  const { setFullEntityContext } = useFlowChat();

  // Credits state management
  const creditsState = useCreditsState({ orderId: orderId !== 'new' ? orderId : null });

  // Adjustments state management
  const adjustmentsState = useAdjustmentsState();

  // Acknowledgements state management
  const acknowledgementsState = useAcknowledgementsState({
    orderId: orderId !== 'new' ? orderId : null,
  });

  // Create Invoice from Order modal state
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Duplicate Order modal state
  const [showDuplicateOrderModal, setShowDuplicateOrderModal] = useState(false);
  const duplicateOrderMutation = useDuplicateOrder();

  // Current reps with names (for passing to line items when adding new ones)
  const [currentOutsideReps, setCurrentOutsideReps] = useState<RepSplitRate[]>([]);
  const [currentInsideReps, setCurrentInsideReps] = useState<RepSplitRate[]>([]);

  // Auto-populate reps hook for settings toggle
  const { fetchOutsideRepsFromCustomer, fetchInsideRepsFromFactory } = useAutoPopulateReps();

  // Set full entity context for global chatbot (type, id, and order number)
  useEffect(() => {
    if (state?.order?.orderNumber && orderId) {
      setFullEntityContext('order', orderId, state.order.orderNumber);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [state?.order?.orderNumber, orderId, setFullEntityContext]);

  // Wrapped handlers for settings changes with rep redistribution
  const handleSetShowOutsideRepPerLine = async (value: boolean) => {
    state.setShowOutsideRepPerLine(value);

    if (value) {
      // Switching to per-line-item mode: ALWAYS fetch from END USER to get proper names
      const endUserId = (order as any)?.endUserId;
      if (endUserId) {
        try {
          const reps = await fetchOutsideRepsFromCustomer(endUserId);
          if (reps.length > 0) {
            // Store for new line items to inherit
            setCurrentOutsideReps(reps);
            const outsideSplitRates = reps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }));
            if (order?.lineItems && order.lineItems.length > 0) {
              const updatedLineItems = order.lineItems.map(item => ({
                ...item,
                outsideSplitRates,
              }));
              state.updateLocalOrder({ lineItems: updatedLineItems });
            }
          }
        } catch (error) {
          console.error('Failed to fetch outside reps:', error);
        }
      }
    } else if (order?.lineItems) {
      // Switching to header mode: clear line item reps
      const updatedLineItems = order.lineItems.map(item => ({
        ...item,
        outsideSplitRates: [],
      }));
      state.updateLocalOrder({ lineItems: updatedLineItems });
    }
  };

  const handleSetShowInsideRepPerLine = async (value: boolean) => {
    state.setShowInsideRepPerLine(value);

    if (value) {
      // Switching to per-line-item mode: ALWAYS fetch from factory to get proper names
      if (order?.manufacturerId) {
        try {
          const reps = await fetchInsideRepsFromFactory(order.manufacturerId);
          if (reps.length > 0) {
            // Store for new line items to inherit
            setCurrentInsideReps(reps);
            const insideSplitRates = reps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }));
            if (order.lineItems && order.lineItems.length > 0) {
              const updatedLineItems = order.lineItems.map(item => ({
                ...item,
                insideSplitRates,
              }));
              state.updateLocalOrder({ lineItems: updatedLineItems });
            }
          }
        } catch (error) {
          console.error('Failed to fetch inside reps:', error);
        }
      }
    } else if (order?.lineItems) {
      // Switching to header mode: clear line item reps
      const updatedLineItems = order.lineItems.map(item => ({
        ...item,
        insideSplitRates: [],
      }));
      state.updateLocalOrder({ lineItems: updatedLineItems });
    }
  };

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

      // Validate required dates
      if (!order.dueDate) {
        console.error('❌ VALIDATION FAILED: Due Date is missing');
        orderToasts.updateError('Due Date is required.');
        return;
      }

      if (!order.requestedShipDate && !order.shipDate) {
        console.error('❌ VALIDATION FAILED: Projected Ship Date is missing');
        orderToasts.updateError('Projected Ship Date is required.');
        return;
      }

      // Validate End User based on settings (REQUIRED field)
      const orderEndUserId = (order as any).endUserId;

      console.log('🔍 END USER VALIDATION CHECK:', {
        showEndUserPerLine: state.showEndUserPerLine,
        orderEndUserId: orderEndUserId,
        lineItemsCount: order.lineItems?.length,
        lineItems: order.lineItems?.map(item => ({
          id: item.id,
          lineNumber: item.lineNumber,
          partNumber: item.partNumber,
          endUserId: (item as any).endUserId,
        }))
      });

      if (!state.showEndUserPerLine) {
        // When toggle is OFF, header End User is REQUIRED
        if (!orderEndUserId || orderEndUserId.trim() === '' || !isValidUUID(orderEndUserId)) {
          console.error('❌ VALIDATION FAILED: Header End User is missing or invalid');
          orderToasts.updateError('End User is required at the header level. Please select an End User.');
          return;
        }
      } else {
        // When toggle is ON, EACH line item MUST have End User
        if (!order.lineItems || order.lineItems.length === 0) {
          console.error('❌ VALIDATION FAILED: No line items');
          orderToasts.updateError('Please add at least one line item.');
          return;
        }

        const lineItemsWithoutEndUser = order.lineItems.filter(item => {
          const lineEndUserId = (item as any).endUserId;
          return !lineEndUserId || lineEndUserId.trim() === '' || !isValidUUID(lineEndUserId);
        });

        console.log('🔍 Line items without end user:', lineItemsWithoutEndUser.length, lineItemsWithoutEndUser.map(item => ({
          id: item.id,
          lineNumber: item.lineNumber,
          partNumber: item.partNumber,
        })));

        if (lineItemsWithoutEndUser.length > 0) {
          console.error('❌ VALIDATION FAILED: Line items missing End User');
          orderToasts.updateError(`End User is required for all line items. ${lineItemsWithoutEndUser.length} line item(s) are missing End User. Please set End User in Additional Details for each line item.`);
          return;
        }
      }

      console.log('✅ END USER VALIDATION PASSED');

      // Build inside reps array from insideRepSplits (supports multiple reps with split commission)
      // If split commission is enabled, use all reps from insideRepSplits; otherwise use primary insideRepId
      let insideSplitRates: { userId: string; splitRate: number; position: number }[] | undefined;
      if (state.splitInsideCommission && state.insideRepSplits.length > 0) {
        // Use all inside reps from split modal
        insideSplitRates = state.insideRepSplits.map((rep, idx) => ({
          userId: rep.repId,
          splitRate: Number(rep.percentage),
          position: idx,
        }));
      } else if (state.orderInsideRep || order.insideRepId) {
        // Single inside rep
        insideSplitRates = [{
          userId: state.orderInsideRep || order.insideRepId || '',
          splitRate: 100,
          position: 0,
        }];
      }

      // Build outside reps array from outsideRepSplits (supports multiple reps with split commission)
      // If split commission is enabled, use all reps from outsideRepSplits; otherwise use primary outsideRepId
      let outsideSplitRates: { userId: string; splitRate: number; position: number }[] | undefined;
      if (state.splitOutsideCommission && state.outsideRepSplits.length > 0) {
        // Use all outside reps from split modal
        outsideSplitRates = state.outsideRepSplits.map((rep, idx) => ({
          userId: rep.repId,
          splitRate: Number(rep.percentage),
          position: idx,
        }));
      } else if (state.orderOutsideRep || (order as any).outsideRepId) {
        // Single outside rep
        outsideSplitRates = [{
          userId: state.orderOutsideRep || (order as any).outsideRepId || '',
          splitRate: 100,
          position: 0,
        }];
      }

      // Build details with insideSplitRates and outsideSplitRates at detail level
      const buildDetails = (includeId: boolean) => (order.lineItems || []).map((item, index) => {
        // CRITICAL: Check if this is a new line item (no valid UUID)
        // If the line item is new, its split rates should NOT have IDs either
        const isNewLineItem = !item.id || !isValidUUID(item.id);

        // Determine which split rates to use based on per-line-item settings:
        // - If per-line-item is enabled, use the line item's own split rates
        // - If disabled, use header-level split rates for all line items
        let lineInsideSplitRates = insideSplitRates;
        let lineOutsideSplitRates = outsideSplitRates;

        if (state.showInsideRepPerLine && (item as any).insideSplitRates?.length > 0) {
          // Use line item's own inside split rates
          // Only include split rate ID if the parent line item is NOT new (existing in DB)
          lineInsideSplitRates = (item as any).insideSplitRates.map((sr: any, idx: number) => ({
            ...(!isNewLineItem && sr.id && isValidUUID(sr.id) ? { id: sr.id } : {}),
            userId: sr.userId || '',
            splitRate: Number(sr.splitRate) || 100,
            position: sr.position ?? idx,
          }));
        }

        if (state.showOutsideRepPerLine && (item as any).outsideSplitRates?.length > 0) {
          // Use line item's own outside split rates
          // Only include split rate ID if the parent line item is NOT new (existing in DB)
          lineOutsideSplitRates = (item as any).outsideSplitRates.map((sr: any, idx: number) => ({
            ...(!isNewLineItem && sr.id && isValidUUID(sr.id) ? { id: sr.id } : {}),
            userId: sr.userId || '',
            splitRate: Number(sr.splitRate) || 100,
            position: sr.position ?? idx,
          }));
        }

        const detail: any = {
          itemNumber: item.lineNumber || index + 1,
          quantity: String(item.quantity || 0),
          unitPrice: String(item.unitPrice || 0),
          productId: item.productId || undefined,
          productNameAdhoc: item.partNumber || undefined,
          productDescriptionAdhoc: item.description || undefined,
          commissionRate: String((item.commissionRate || 0) * 100), // Convert decimal to percent for API
          divisionFactor: item.divisor ? String(item.divisor) : undefined,
          uomId: item.uomId || undefined, // Send uomId, null becomes undefined
          // Include inside and outside rep splitRates on each line item
          insideSplitRates: lineInsideSplitRates,
          outsideSplitRates: lineOutsideSplitRates,
          // Additional details fields
          commissionDiscountRate: (item as any).commissionDiscountPercent ? String((item as any).commissionDiscountPercent) : undefined,
          discountRate: (item as any).lineDiscountPercent ? String((item as any).lineDiscountPercent) : undefined,
          leadTime: (item as any).leadTime || undefined,
          note: (item as any).note || undefined,
        };
        // Get endUserId: RESPECT the showEndUserPerLine setting!
        // - When showEndUserPerLine is TRUE: use line-item's endUserId
        // - When showEndUserPerLine is FALSE: ALWAYS use header-level endUserId for ALL line items
        let endUserIdToUse: string | undefined;

        if (state.showEndUserPerLine) {
          // Per-line-item is ON: use line item's end user
          const lineEndUserId = (item as any).endUserId;
          endUserIdToUse = (lineEndUserId && isValidUUID(lineEndUserId)) ? lineEndUserId : undefined;
        } else {
          // Per-line-item is OFF: ALWAYS use header-level end user, ignoring any line-item end users
          endUserIdToUse = (orderEndUserId && isValidUUID(orderEndUserId)) ? orderEndUserId : undefined;
        }

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
        // Create new order - split rates are now at detail level
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
          details: buildDetails(false),
          // Settings for per-line-item configuration
          endUserPerLineItem: state.showEndUserPerLine,
          insidePerLineItem: state.showInsideRepPerLine,
          outsidePerLineItem: state.showOutsideRepPerLine,
        };

        console.log('Creating order with input:', createInput);
        const result = await state.createOrderMutation.mutateAsync(createInput);
        console.log('Order created:', result);
        orderToasts.createSuccess(result.orderNumber || createInput.orderNumber);
        router.push('/orders');
      } else {
        // Update existing order - split rates are now at detail level
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
            details: buildDetails(true),
            // Settings for per-line-item configuration
            endUserPerLineItem: state.showEndUserPerLine,
            insidePerLineItem: state.showInsideRepPerLine,
            outsidePerLineItem: state.showOutsideRepPerLine,
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
    creditsState.openCreateCreditModal();
  };

  const handleAddAcknowledgement = () => {
    acknowledgementsState.openCreateAcknowledgementModal();
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

  // Handler to auto-populate outside reps for all line items
  const handleAutoPopulateOutsideRepsToLineItems = (reps: RepSplitRate[]) => {
    // Always store the current reps for new line items to inherit
    setCurrentOutsideReps(reps);

    if (!order.lineItems || order.lineItems.length === 0) return;

    // Convert RepSplitRate[] to the format expected by line items
    const outsideSplitRates = reps.map((rep, idx) => ({
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
      userId: rep.userId,
      userName: rep.userName,
      splitRate: rep.splitRate,
      position: idx + 1,
    }));

    // Update all line items with the same outside reps
    const updatedLineItems = order.lineItems.map(item => ({
      ...item,
      outsideSplitRates,
    }));

    state.updateLocalOrder({ lineItems: updatedLineItems });
  };

  // Handler to auto-populate inside reps for all line items
  const handleAutoPopulateInsideRepsToLineItems = (reps: RepSplitRate[]) => {
    // Always store the current reps for new line items to inherit
    setCurrentInsideReps(reps);

    if (!order.lineItems || order.lineItems.length === 0) return;

    // Convert RepSplitRate[] to the format expected by line items
    const insideSplitRates = reps.map((rep, idx) => ({
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
      userId: rep.userId,
      userName: rep.userName,
      splitRate: rep.splitRate,
      position: idx + 1,
    }));

    // Update all line items with the same inside reps
    const updatedLineItems = order.lineItems.map(item => ({
      ...item,
      insideSplitRates,
    }));

    state.updateLocalOrder({ lineItems: updatedLineItems });
  };

  return (
    <main className="flex flex-col min-h-full bg-[var(--background)]">
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
        showOutsideRepPerLine={state.showOutsideRepPerLine}
        showInsideRepPerLine={state.showInsideRepPerLine}
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
        onCreateInvoice={() => setShowCreateInvoiceModal(true)}
        onDuplicateOrder={() => setShowDuplicateOrderModal(true)}
        onAutoPopulateOutsideRepsToLineItems={handleAutoPopulateOutsideRepsToLineItems}
        onAutoPopulateInsideRepsToLineItems={handleAutoPopulateInsideRepsToLineItems}
      />

      {/* Main Content Area with Tabs */}
      <div className="flex-1 flex flex-col p-6">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white pt-4 px-4 -mx-6 -mt-6">
          <div className="flex gap-1">
            {[
              { id: 'line-items', label: 'Line Items', count: (order.lineItems || []).length },
              { id: 'files', label: 'Files', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'credits', label: 'Credits', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'adjustments', label: 'Adjustments', hidden: true }, // Hidden - adjustments now has its own page in sidebar
              { id: 'acknowledgements', label: 'Acknowledgements', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'notes', label: 'Notes', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'tasks', label: 'Tasks', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'activity', label: 'Activity', comingSoon: true, disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'linked-objects', label: 'Linked Objects', disabled: isCreateMode, disabledReason: 'Save order first' },
              { id: 'settings', label: 'Settings' },
            ].filter(tab => !tab.hidden).map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && !tab.comingSoon && state.setActiveTab(tab.id as any)}
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
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab.disabled ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            {isCreateMode && (
              <span className="ml-auto text-xs text-[var(--muted-foreground)] italic pr-2">
                Some tabs will unlock after saving
              </span>
            )}
          </div>

          {/* View Controls - only show when Line Items tab is active */}
          {state.activeTab === 'line-items' && (
            <div className="flex items-center gap-3 pb-2">
              {/* Views Dropdown */}
              <div className="relative">
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg transition-colors opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M3 8h14M8 8v9"/>
                  </svg>
                  Default
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
                </button>
              </div>

              {/* Sections Button */}
              <button
                disabled
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg transition-colors opacity-50 cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="14" height="4" rx="1"/>
                  <rect x="3" y="10" width="14" height="7" rx="1"/>
                </svg>
                Sections
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
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
        <div className="flex-1 pb-32">
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
              showOutsideRepPerLine={state.showOutsideRepPerLine}
              showInsideRepPerLine={state.showInsideRepPerLine}
              onOpenAdditionalDetails={state.openAdditionalDetails}
              currentOutsideReps={currentOutsideReps}
              currentInsideReps={currentInsideReps}
            />
          )}

          {state.activeTab === 'files' && (
            <div className="flex-1 overflow-auto">
              <FilesTab
                entityId={orderId}
                entityType="ORDER"
              />
            </div>
          )}

          {state.activeTab === 'notes' && <NotesTab orderId={orderId} />}
          {state.activeTab === 'tasks' && <TasksTab orderId={orderId} />}
          {state.activeTab === 'activity' && <ActivityTab />}
          {state.activeTab === 'credits' && (
            <CreditsTab
              credits={creditsState.credits}
              isLoading={creditsState.isLoadingCredits}
              error={creditsState.creditsError}
              onAddCredit={creditsState.openCreateCreditModal}
              onViewCredit={creditsState.viewCredit}
              onEditCredit={creditsState.openEditCreditModal}
              onDeleteCredit={creditsState.handleDeleteCredit}
            />
          )}
          {state.activeTab === 'adjustments' && (
            <AdjustmentsTab
              adjustments={adjustmentsState.adjustments}
              isLoading={adjustmentsState.isLoadingAdjustments}
              error={adjustmentsState.adjustmentsError}
              onAddAdjustment={adjustmentsState.openCreateAdjustmentModal}
              onViewAdjustment={adjustmentsState.viewAdjustment}
              onEditAdjustment={adjustmentsState.openEditAdjustmentModal}
              onDeleteAdjustment={adjustmentsState.handleDeleteAdjustment}
            />
          )}
          {state.activeTab === 'acknowledgements' && (
            <AcknowledgementsTab
              acknowledgements={acknowledgementsState.acknowledgements}
              isLoading={acknowledgementsState.isLoadingAcknowledgements}
              error={acknowledgementsState.acknowledgementsError}
              onAddAcknowledgement={acknowledgementsState.openCreateAcknowledgementModal}
              onViewAcknowledgement={acknowledgementsState.viewAcknowledgement}
              onEditAcknowledgement={acknowledgementsState.openEditAcknowledgementModal}
              onDeleteAcknowledgement={acknowledgementsState.handleDeleteAcknowledgement}
            />
          )}
          {state.activeTab === 'linked-objects' && <LinkedObjectsTab orderId={orderId} />}
          {state.activeTab === 'settings' && (
            <SettingsTab
              showEndUserPerLine={state.showEndUserPerLine}
              setShowEndUserPerLine={state.setShowEndUserPerLine}
              showOutsideRepPerLine={state.showOutsideRepPerLine}
              setShowOutsideRepPerLine={handleSetShowOutsideRepPerLine}
              showInsideRepPerLine={state.showInsideRepPerLine}
              setShowInsideRepPerLine={handleSetShowInsideRepPerLine}
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
        showOutsideRepPerLine={state.showOutsideRepPerLine}
        showInsideRepPerLine={state.showInsideRepPerLine}
      />

      {/* Credits Modals */}
      <CreditModal
        isOpen={creditsState.showCreditModal}
        onClose={creditsState.closeCreditModal}
        order={order}
        credit={creditsState.creditToEdit}
        onSubmit={creditsState.handleSaveCredit}
        isLoading={creditsState.isSavingCredit}
        isLoadingCreditDetails={creditsState.isLoadingCreditDetails}
      />

      <CreditDetailModal
        isOpen={creditsState.showCreditDetailModal}
        onClose={creditsState.closeCreditDetailModal}
        credit={creditsState.selectedCredit}
        onEdit={creditsState.editCreditFromDetail}
        onDelete={creditsState.deleteCreditFromDetail}
        isDeleting={creditsState.isDeletingCredit}
      />

      {/* Adjustments Modals */}
      <AdjustmentModal
        isOpen={adjustmentsState.showAdjustmentModal}
        onClose={adjustmentsState.closeAdjustmentModal}
        order={order}
        adjustment={adjustmentsState.adjustmentToEdit}
        onSubmit={adjustmentsState.handleSaveAdjustment}
        isLoading={adjustmentsState.isSavingAdjustment}
        isLoadingAdjustmentDetails={adjustmentsState.isLoadingAdjustmentDetails}
      />

      <AdjustmentDetailModal
        isOpen={adjustmentsState.showAdjustmentDetailModal}
        onClose={adjustmentsState.closeAdjustmentDetailModal}
        adjustment={adjustmentsState.selectedAdjustment}
        onEdit={adjustmentsState.editAdjustmentFromDetail}
        onDelete={adjustmentsState.deleteAdjustmentFromDetail}
        isDeleting={adjustmentsState.isDeletingAdjustment}
      />

      {/* Acknowledgements Modals */}
      <AcknowledgementModal
        isOpen={acknowledgementsState.showAcknowledgementModal}
        onClose={acknowledgementsState.closeAcknowledgementModal}
        order={order}
        acknowledgement={acknowledgementsState.acknowledgementToEdit}
        onSubmit={acknowledgementsState.handleSaveAcknowledgement}
        isLoading={acknowledgementsState.isSavingAcknowledgement}
        isLoadingDetails={acknowledgementsState.isLoadingAcknowledgementDetails}
      />

      <AcknowledgementDetailModal
        isOpen={acknowledgementsState.showAcknowledgementDetailModal}
        onClose={acknowledgementsState.closeAcknowledgementDetailModal}
        acknowledgement={acknowledgementsState.selectedAcknowledgement}
        onEdit={acknowledgementsState.editAcknowledgementFromDetail}
        onDelete={acknowledgementsState.deleteAcknowledgementFromDetail}
        isDeleting={acknowledgementsState.isDeletingAcknowledgement}
      />

      {/* Delete Confirmation Modal for Credits */}
      <DeleteConfirmModal
        isOpen={creditsState.showDeleteConfirmModal}
        title="Delete Credit?"
        message="Are you sure you want to delete credit"
        itemName={creditsState.creditToDelete?.creditNumber || creditsState.creditToDelete?.id?.substring(0, 8)}
        isPending={creditsState.isDeletingCredit}
        onConfirm={creditsState.handleConfirmDelete}
        onCancel={creditsState.closeDeleteConfirmModal}
      />

      {/* Delete Confirmation Modal for Adjustments */}
      <DeleteConfirmModal
        isOpen={adjustmentsState.showDeleteConfirmModal}
        title="Delete Adjustment?"
        message="Are you sure you want to delete adjustment"
        itemName={adjustmentsState.adjustmentToDelete?.adjustmentNumber || adjustmentsState.adjustmentToDelete?.id?.substring(0, 8)}
        isPending={adjustmentsState.isDeletingAdjustment}
        onConfirm={adjustmentsState.handleConfirmDelete}
        onCancel={adjustmentsState.closeDeleteConfirmModal}
      />

      {/* Delete Confirmation Modal for Acknowledgements */}
      <DeleteConfirmModal
        isOpen={acknowledgementsState.showDeleteConfirmModal}
        title="Delete Acknowledgement?"
        message="Are you sure you want to delete acknowledgement"
        itemName={acknowledgementsState.acknowledgementToDelete?.orderAcknowledgementNumber || acknowledgementsState.acknowledgementToDelete?.id?.substring(0, 8)}
        isPending={acknowledgementsState.isDeletingAcknowledgement}
        onConfirm={acknowledgementsState.handleConfirmDelete}
        onCancel={acknowledgementsState.closeDeleteConfirmModal}
      />

      {/* Create Invoice from Order Modal */}
      <CreateInvoiceFromOrderModal
        isOpen={showCreateInvoiceModal}
        orderId={order.id}
        orderNumber={order.orderNumber}
        factoryId={order.manufacturerId}
        factoryName={order.manufacturerName}
        lineItems={order.lineItems || []}
        onClose={() => setShowCreateInvoiceModal(false)}
        onSuccess={(invoice) => {
          orderToasts.invoiceCreatedFromOrder(invoice.invoiceNumber || invoice.id);
        }}
      />

      {/* Duplicate Order Modal */}
      <DuplicateOrderModal
        isOpen={showDuplicateOrderModal}
        orderNumber={order.orderNumber}
        currentCustomerId={order.customerId}
        currentCustomerName={order.customerName}
        isPending={duplicateOrderMutation.isPending}
        onClose={() => setShowDuplicateOrderModal(false)}
        onDuplicate={async (newOrderNumber, newSoldToCustomerId) => {
          try {
            const duplicatedOrder = await duplicateOrderMutation.mutateAsync({
              orderId: order.id,
              newOrderNumber,
              newSoldToCustomerId,
            });
            setShowDuplicateOrderModal(false);
            orderToasts.duplicateSuccess(duplicatedOrder.orderNumber);
            // Navigate to the new order
            router.push(`/orders/${duplicatedOrder.id}`);
          } catch (error) {
            orderToasts.duplicateError(error instanceof Error ? error.message : 'Failed to duplicate order');
          }
        }}
      />
    </main>
  );
}
