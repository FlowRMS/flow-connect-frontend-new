/**
 * useInvoiceDetailState Hook
 * Main state management hook for invoice detail
 * Manages overall state and integrates sub-hooks
 */

import { useState, useMemo, useEffect } from 'react';
import type { Invoice, OrderSplitRate } from '@/lib/types/rms';
import type { TabType, ViewMode, LineItemCredit, OrderTooltipState, VersionInfo, RepSplit, ProductToConvert, ColumnKey } from '../types';
import { mockInvoices, mockOrders, mockSalesReps } from '@/lib/data/rms-mock';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';
import { calculateInvoiceTotals } from '../utils';

interface UseInvoiceDetailStateProps {
  invoiceId: string;
}

export function useInvoiceDetailState({ invoiceId }: UseInvoiceDetailStateProps) {
  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  // Get current invoice
  const invoice = useMemo(
    () => invoices.find((i) => i.id === invoiceId),
    [invoices, invoiceId]
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_ACTIVE_TAB);

  // Header fields state
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // Header dropdowns
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Order tooltip state
  const [orderTooltip, setOrderTooltip] = useState<OrderTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    orders: [],
  });
  const [portalMounted, setPortalMounted] = useState(false);

  // Ensure portal is only rendered on client side
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([
    { version: 1, date: '12/14/2024', isLatest: true },
  ]);

  // View mode state (header dropdown)
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // PO Number state
  const [poNumber, setPoNumber] = useState<string>('');

  // Outside rep state
  const [invoiceOutsideRep, setInvoiceOutsideRep] = useState<string>('');
  const [splitOutsideCommission, setSplitOutsideCommission] = useState(false);
  const [showOutsideRepSplitsModal, setShowOutsideRepSplitsModal] = useState(false);
  const [outsideRepSplits, setOutsideRepSplits] = useState<RepSplit[]>([]);

  // Inside rep state
  const [invoiceInsideRep, setInvoiceInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepSplits, setInsideRepSplits] = useState<RepSplit[]>([]);

  // Warehouse conversion state
  const [showWarehouseConversionModal, setShowWarehouseConversionModal] = useState(false);
  const [warehouseConversionMode, setWarehouseConversionMode] = useState<'all' | 'selected'>('all');
  const [productsToConvert, setProductsToConvert] = useState<ProductToConvert[]>([]);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Check if invoice is connected to an order
  const isConnectedToOrder = useMemo(() => !!invoice?.orderId, [invoice]);

  // Line item credits - maps invoice line item ID to credit info inherited from linked order
  const lineItemCredits = useMemo<Record<string, LineItemCredit>>(() => {
    const credits: Record<string, LineItemCredit> = {};

    if (!invoice) return credits;

    // Find the linked order
    const order = mockOrders.find((o) => o.id === invoice.orderId);
    if (!order) return credits;

    // For each invoice line item, check if there's a credit on the linked order line
    invoice.lineItems.forEach((invLine) => {
      // Find credit line items that reference this order line item
      const creditLines = order.lineItems.filter(
        (ol) => ol.isCredit && ol.linkedLineItemId === invLine.orderLineItemId
      );

      creditLines.forEach((creditLine) => {
        // Get the original order line to find original values
        const originalOrderLine = order.lineItems.find(
          (ol) => ol.id === creditLine.linkedLineItemId
        );
        if (originalOrderLine) {
          credits[invLine.id] = {
            creditName: `CR-${creditLine.id}`,
            creditType:
              creditLine.creditType === 'return'
                ? 'Return'
                : creditLine.creditType === 'short_ship'
                ? 'Short Ship'
                : creditLine.creditType === 'cancel'
                ? 'Cancel'
                : creditLine.creditType === 'damage'
                ? 'Damage'
                : 'Credit',
            creditQty: Math.abs(creditLine.quantity),
            originalQty: originalOrderLine.quantity,
            originalTotal: originalOrderLine.quantity * originalOrderLine.unitPrice,
          };
        }
      });
    });

    return credits;
  }, [invoice]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!invoice) {
      return {
        subtotal: 0,
        freight: 0,
        total: 0,
        commission: 0,
        amountPaid: 0,
        balance: 0,
        totalOvg: 0,
        totalEarn: 0,
      };
    }
    return calculateInvoiceTotals(invoice);
  }, [invoice]);

  // Commission split percentage total
  const splitPercentageTotal = useMemo(() => {
    return editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
  }, [editedSplits]);

  // Toggle line item selection
  const toggleLineItemSelection = (lineItemId: string) => {
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineItemId)) {
        newSet.delete(lineItemId);
      } else {
        newSet.add(lineItemId);
      }
      return newSet;
    });
  };

  // Select all line items
  const selectAllLineItems = () => {
    if (!invoice) return;
    const allIds = new Set(invoice.lineItems.map((item) => item.id));
    if (selectedLineItems.size === invoice.lineItems.length) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(allIds);
    }
  };

  // Clear selection
  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (invoice) {
      setEditedSplits([...invoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    if (invoice) {
      updated[index].commissionAmount =
        (invoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find((r) => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = {
        ...updated[index],
        salesRepId: repId,
        salesRepName: rep.name,
      };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (invoice) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...invoice,
        splitRates: editedSplits,
      };
      setInvoices(
        invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i))
      );
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  // Update invoice status
  const updateInvoiceStatus = (status: Invoice['status']) => {
    if (!invoice) return;
    const updatedInvoice = { ...invoice, status };
    setInvoices(invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)));
  };

  if (!invoice) {
    return null;
  }

  return {
    // Invoice data
    invoice,
    invoices,
    setInvoices,

    // Tab state
    activeTab,
    setActiveTab,

    // Header fields
    showHeaderFields,
    setShowHeaderFields,

    // Line items selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Column visibility
    visibleColumns,
    setVisibleColumns,
    showColumnsMenu,
    setShowColumnsMenu,

    // Header dropdowns
    showActionsDropdown,
    setShowActionsDropdown,
    showStatusDropdown,
    setShowStatusDropdown,
    showSaveDropdown,
    setShowSaveDropdown,

    // Order tooltip
    orderTooltip,
    setOrderTooltip,
    portalMounted,

    // Version state
    currentVersion,
    setCurrentVersion,
    showVersionDropdown,
    setShowVersionDropdown,
    availableVersions,
    setAvailableVersions,

    // View mode
    viewMode,
    setViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,

    // PO Number
    poNumber,
    setPoNumber,

    // Outside rep
    invoiceOutsideRep,
    setInvoiceOutsideRep,
    splitOutsideCommission,
    setSplitOutsideCommission,
    showOutsideRepSplitsModal,
    setShowOutsideRepSplitsModal,
    outsideRepSplits,
    setOutsideRepSplits,

    // Inside rep
    invoiceInsideRep,
    setInvoiceInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    showInsideRepSplitsModal,
    setShowInsideRepSplitsModal,
    insideRepSplits,
    setInsideRepSplits,

    // Warehouse conversion
    showWarehouseConversionModal,
    setShowWarehouseConversionModal,
    warehouseConversionMode,
    setWarehouseConversionMode,
    productsToConvert,
    setProductsToConvert,

    // Commission splits
    editingSplits,
    setEditingSplits,
    editedSplits,
    setEditedSplits,
    startEditingSplits,
    cancelEditingSplits,
    updateSplitPercentage,
    addNewSplit,
    removeSplit,
    updateSplitRep,
    saveSplits,
    splitPercentageTotal,

    // Computed values
    isConnectedToOrder,
    lineItemCredits,
    totals,

    // Actions
    updateInvoiceStatus,
  };
}

