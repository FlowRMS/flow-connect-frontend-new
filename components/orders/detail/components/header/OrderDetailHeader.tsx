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
  } = props;

  // Calculate totals
  const totals = React.useMemo(() => {
    // Filter product lines (non-freight)
    const productLines = order.lineItems.filter(item => item.partNumber !== 'FREIGHT');

    const subtotal = order.subtotal;
    const freight = order.freight;
    const total = order.total;
    const commission = order.totalCommission;

    // Calculate overage: unitPrice * 0.15 * quantity * 0.85
    const totalOvg = productLines.reduce((sum, item) =>
      sum + (item.unitPrice * 0.15 * item.quantity * 0.85), 0
    );

    const totalEarn = commission + totalOvg;

    return { subtotal, freight, total, commission, totalOvg, totalEarn };
  }, [order]);

  return (
    <>
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
        updateOrderStatus={updateOrderStatus}
        setShowQuoteLookupModal={setShowQuoteLookupModal}
        handleMakeWarehouseOrder={handleMakeWarehouseOrder}
        handleGenerateFulfillmentRequest={handleGenerateFulfillmentRequest}
      />

      <PricingSummaryBar
        order={order}
        viewMode={viewMode}
        totals={totals}
      />

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
      />
    </>
  );
}
