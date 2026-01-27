/**
 * OrderDetailHeader Component
 * Main header container integrating all header sections:
 * - HeaderTopBar (back button, title, actions, dropdowns)
 * - PricingSummaryBar (ship status, totals)
 * - OrderDetailsFields (collapsible form fields)
 */

'use client';

import React from 'react';
import { Order } from '@/lib/types/rms';
import { RepSplit, ViewMode } from '../../types';
import { HeaderTopBar } from './HeaderTopBar';
import { PricingSummaryBar } from './PricingSummaryBar';
import { OrderDetailsFields } from './OrderDetailsFields';
import { RepSplitRate } from '@/components/shared/hooks/useAutoPopulateReps';

interface OrderDetailHeaderProps {
  order: Order;
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showViewModeDropdown: boolean;
  setShowViewModeDropdown: (show: boolean) => void;
  showSaveDropdown: boolean;
  setShowSaveDropdown: (show: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
  orderOutsideRep: string;
  setOrderOutsideRep: (value: string) => void;
  splitOutsideCommission: boolean;
  setSplitOutsideCommission: (value: boolean) => void;
  outsideRepSplits: RepSplit[];
  setOutsideRepSplits: (splits: RepSplit[]) => void;
  openOutsideRepModal: () => void;
  orderInsideRep: string;
  setOrderInsideRep: (value: string) => void;
  splitInsideCommission: boolean;
  setSplitInsideCommission: (value: boolean) => void;
  insideRepSplits: RepSplit[];
  setInsideRepSplits: (splits: RepSplit[]) => void;
  openInsideRepModal: () => void;
  // New props for field updates
  onUpdateOrder?: (updates: Partial<Order>) => void;
  isCreateMode?: boolean;
  hasChanges?: boolean;
  isSaving?: boolean;
  // Settings for per-line-item fields
  showEndUserPerLine?: boolean;
  showOutsideRepPerLine?: boolean;
  showInsideRepPerLine?: boolean;
  // Additional props needed for HeaderTopBar
  showActionsDropdown?: boolean;
  setShowActionsDropdown?: (show: boolean) => void;
  showStatusDropdown?: boolean;
  setShowStatusDropdown?: (show: boolean) => void;
  showVersionDropdown?: boolean;
  setShowVersionDropdown?: (show: boolean) => void;
  currentVersion?: number;
  setCurrentVersion?: (version: number) => void;
  availableVersions?: any[];
  setAvailableVersions?: (versions: any[]) => void;
  setVisibleColumns?: (columns: any) => void;
  setActiveView?: (view: string) => void;
  updateOrderStatus?: (status: Order['status']) => void;
  setShowQuoteLookupModal?: (show: boolean) => void;
  handleMakeWarehouseOrder?: () => void;
  handleGenerateFulfillmentRequest?: () => void;
  onCreateInvoice?: () => void;
  onDuplicateOrder?: () => void;
  onBack?: () => void;
  // Callbacks for auto-populating reps at line item level
  onAutoPopulateOutsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
  onAutoPopulateInsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
}

export function OrderDetailHeader(props: OrderDetailHeaderProps) {
  const {
    order,
    showHeaderFields,
    toggleHeaderFields,
    viewMode,
    setViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,
    showSaveDropdown,
    setShowSaveDropdown,
    onSave,
    onDelete,
    orderOutsideRep,
    setOrderOutsideRep,
    splitOutsideCommission,
    setSplitOutsideCommission,
    outsideRepSplits,
    setOutsideRepSplits,
    openOutsideRepModal,
    orderInsideRep,
    setOrderInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    insideRepSplits,
    setInsideRepSplits,
    openInsideRepModal,
    // New props for field updates
    onUpdateOrder,
    isCreateMode = false,
    hasChanges = false,
    isSaving = false,
    // Settings for per-line-item fields
    showEndUserPerLine = false,
    showOutsideRepPerLine = false,
    showInsideRepPerLine = false,
    // Additional props with defaults
    showActionsDropdown = false,
    setShowActionsDropdown = () => {},
    showStatusDropdown = false,
    setShowStatusDropdown = () => {},
    showVersionDropdown = false,
    setShowVersionDropdown = () => {},
    currentVersion = 1,
    setCurrentVersion = () => {},
    availableVersions = [],
    setAvailableVersions = () => {},
    setVisibleColumns = () => {},
    setActiveView = () => {},
    updateOrderStatus = () => {},
    setShowQuoteLookupModal = () => {},
    handleMakeWarehouseOrder = () => { alert('Warehouse conversion - coming soon'); },
    handleGenerateFulfillmentRequest = () => { alert('Fulfillment request - coming soon'); },
    onCreateInvoice,
    onDuplicateOrder,
    onBack,
    onAutoPopulateOutsideRepsToLineItems,
    onAutoPopulateInsideRepsToLineItems,
  } = props;

  // Calculate totals from line items
  // Includes line discounts and commission discounts from AdditionalDetailsModal
  const totals = React.useMemo(() => {
    const lineItems = order.lineItems || [];
    const productLines = lineItems.filter(item => item.partNumber !== 'FREIGHT');

    // Calculate subtotal from line items (extended price minus line discounts)
    const subtotal = productLines.reduce((sum, item) => {
      const ext = Number(item.extendedPrice) || 0;
      const lineDiscount = Number((item as any).lineDiscountAmount) || 0;
      return sum + (ext - lineDiscount);
    }, 0);

    const freight = Number(order.freight) || 0;
    const total = subtotal + freight;

    // Calculate commission from line items (commission amount minus commission discounts)
    const commission = productLines.reduce((sum, item) => {
      const comm = Number(item.commissionAmount) || 0;
      const commDiscount = Number((item as any).commissionDiscountAmount) || 0;
      return sum + (comm - commDiscount);
    }, 0);

    // Calculate overage
    const totalOvg = productLines.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * 0.15 * qty * 0.85);
    }, 0);

    const totalEarn = commission + totalOvg;

    return { subtotal, freight, total, commission, totalOvg, totalEarn };
  }, [order]);

  return (
    <>
      {/* Sticky header section containing top bar and pricing summary */}
      <div className="sticky top-0 z-30 bg-[var(--background)]">
        <HeaderTopBar
          order={order}
          showActionsDropdown={showActionsDropdown}
          setShowActionsDropdown={setShowActionsDropdown}
          showStatusDropdown={showStatusDropdown}
          setShowStatusDropdown={setShowStatusDropdown}
          showVersionDropdown={showVersionDropdown}
          setShowVersionDropdown={setShowVersionDropdown}
          showViewModeDropdown={showViewModeDropdown}
          setShowViewModeDropdown={setShowViewModeDropdown}
          showSaveDropdown={showSaveDropdown}
          setShowSaveDropdown={setShowSaveDropdown}
          currentVersion={currentVersion}
          setCurrentVersion={setCurrentVersion}
          availableVersions={availableVersions}
          setAvailableVersions={setAvailableVersions}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setVisibleColumns={setVisibleColumns}
          setActiveView={setActiveView}
          onSave={onSave}
          isCreateMode={isCreateMode}
          hasChanges={hasChanges}
          isSaving={isSaving}
          updateOrderStatus={updateOrderStatus}
          setShowQuoteLookupModal={setShowQuoteLookupModal}
          handleMakeWarehouseOrder={handleMakeWarehouseOrder}
          handleGenerateFulfillmentRequest={handleGenerateFulfillmentRequest}
          onCreateInvoice={onCreateInvoice}
          onDuplicateOrder={onDuplicateOrder}
          onDelete={onDelete}
          onBack={onBack}
        />

        <PricingSummaryBar
          order={order}
          viewMode={viewMode}
          totals={totals}
        />
      </div>

      <OrderDetailsFields
        order={order}
        showHeaderFields={showHeaderFields}
        toggleHeaderFields={toggleHeaderFields}
        orderOutsideRep={orderOutsideRep}
        setOrderOutsideRep={setOrderOutsideRep}
        splitOutsideCommission={splitOutsideCommission}
        setSplitOutsideCommission={setSplitOutsideCommission}
        outsideRepSplits={outsideRepSplits}
        setOutsideRepSplits={setOutsideRepSplits}
        openOutsideRepModal={openOutsideRepModal}
        orderInsideRep={orderInsideRep}
        setOrderInsideRep={setOrderInsideRep}
        splitInsideCommission={splitInsideCommission}
        setSplitInsideCommission={setSplitInsideCommission}
        insideRepSplits={insideRepSplits}
        setInsideRepSplits={setInsideRepSplits}
        openInsideRepModal={openInsideRepModal}
        onUpdateOrder={onUpdateOrder}
        isCreateMode={isCreateMode}
        showEndUserPerLine={showEndUserPerLine}
        showOutsideRepPerLine={showOutsideRepPerLine}
        showInsideRepPerLine={showInsideRepPerLine}
        onAutoPopulateOutsideRepsToLineItems={onAutoPopulateOutsideRepsToLineItems}
        onAutoPopulateInsideRepsToLineItems={onAutoPopulateInsideRepsToLineItems}
      />
    </>
  );
}
