'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  mockOrders,
  mockSalesReps,
  mockInvoices,
  mockChecks,
} from '../../lib/data/rms-mock';
import { mockFulfillmentOrders, mockWarehouses, addFulfillmentOrder } from '../../lib/data/warehouse-mock';
import type { OrderSplitRate, OrderLineItem, Invoice, CommissionCheck } from '../../lib/types/rms';
import type { FulfillmentOrder, FulfillmentOrderLineItem } from '../../lib/types/warehouse';
import {
  Order,
  orderStatusLabels,
  orderStatusColors,
  fulfillmentStatusLabels,
  fulfillmentStatusColors,
  billingStatusLabels,
  billingStatusColors,
  commissionStatusLabels,
  commissionStatusColors,
} from '../../lib/types/rms';

interface OrderDetailContentProps {
  orderId: string;
}

type TabType = 'line-items' | 'credits' | 'acknowledgements' | 'notes' | 'tasks' | 'activity' | 'linked-objects' | 'settings';

// Column definitions for the line items table
type ColumnKey = 'partNumber' | 'custPartNumber' | 'description' | 'uom' | 'divisor' | 'unitPrice' | 'quantity' | 'shippedQty' | 'lineStatus' | 'linkedQuote' | 'linkedInvoice' | 'linkedCheck' | 'linkedFulfillment' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'invoiced' | 'percentOver' | 'commissionAmount' | 'ovgPercent' | 'ovgAmount' | 'earnPercent' | 'earnAmount' | 'iconAcknowledgement' | 'iconDocumentSpecific' | 'iconWarehouse' | 'iconCredit';

const columnLabels: Record<ColumnKey, string> = {
  partNumber: 'Part #',
  custPartNumber: 'Cust Part #',
  description: 'Description',
  uom: 'UOM',
  divisor: 'Divisor',
  unitPrice: 'Unit Price',
  quantity: 'Qty',
  shippedQty: 'Shipped Qty',
  lineStatus: 'Status',
  linkedQuote: 'Quote #',
  linkedInvoice: 'Invoice #',
  linkedCheck: 'Check #',
  linkedFulfillment: 'Fulfillment #',
  sellTotal: 'Sell Total',
  commissionPercent: 'Commission %',
  commission: 'Commission',
  commissionTotal: 'Commission Total',
  invoiced: 'Invoiced',
  percentOver: '% Over',
  commissionAmount: 'Com $',
  ovgPercent: 'Ovg %',
  ovgAmount: 'Ovg $',
  earnPercent: 'Earn %',
  earnAmount: 'Earn $',
  iconAcknowledgement: 'Ack Icon',
  iconDocumentSpecific: 'Doc-Specific Icon',
  iconWarehouse: 'Warehouse Icon',
  iconCredit: 'Credit Icon',
};

const defaultVisibleColumns: ColumnKey[] = [
  'partNumber',
  'custPartNumber',
  'description',
  'quantity',
  'uom',
  'divisor',
  'unitPrice',
  'lineStatus',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
  'linkedQuote',
  'linkedInvoice',
  'linkedCheck',
  'linkedFulfillment',
  'iconAcknowledgement',
  'iconDocumentSpecific',
  'iconWarehouse',
  'iconCredit',
];

// Helper function to get linked invoices for an order line item
const getLinkedInvoicesForLineItem = (
  lineItem: OrderLineItem,
  orderId: string,
  allInvoices: Invoice[]
): Invoice[] => {
  // First check explicit linkedInvoiceIds on the line item
  if (lineItem.linkedInvoiceIds && lineItem.linkedInvoiceIds.length > 0) {
    return allInvoices.filter(inv => lineItem.linkedInvoiceIds!.includes(inv.id));
  }

  // Fallback: find invoices that reference this order and have line items matching this order line
  return allInvoices.filter(inv => {
    if (inv.orderId !== orderId) return false;
    // Check if invoice has a line item referencing this order line item
    return inv.lineItems.some(ili => ili.orderLineItemId === lineItem.id);
  });
};

// Helper function to calculate invoiced quantity from linked invoices
const calculateInvoicedQtyFromInvoices = (
  lineItem: OrderLineItem,
  linkedInvoices: Invoice[]
): number => {
  return linkedInvoices.reduce((total, invoice) => {
    // Find matching line item in invoice
    const matchingLine = invoice.lineItems.find(
      ili => ili.orderLineItemId === lineItem.id
    );
    if (matchingLine) {
      return total + matchingLine.quantity;
    }
    // Fallback: if invoice has no line items (unknown line items case), derive qty from amount
    if (invoice.lineItems.length === 0 && lineItem.unitPrice > 0) {
      // For invoices with no line items, we can't determine per-line allocation
      // So we just indicate there's a linked invoice but status will be based on presence
      return total; // Don't add anything - we'll handle this case separately
    }
    return total;
  }, 0);
};

// Helper function to get line item shipping status based on invoice quantities
const getLineShipStatus = (
  lineItem: OrderLineItem,
  linkedInvoices: Invoice[]
): { label: string; color: string } => {
  const orderQty = lineItem.quantity;

  // Calculate invoiced quantity from linked invoices
  let invoicedQty = calculateInvoicedQtyFromInvoices(lineItem, linkedInvoices);

  // Special case: if there are linked invoices with no line items, derive qty from total
  const invoicesWithNoLines = linkedInvoices.filter(inv => inv.lineItems.length === 0);
  if (invoicesWithNoLines.length > 0 && lineItem.unitPrice > 0) {
    // For unknown line items, calculate proportional qty based on invoice total
    // This is a simplification - assumes even distribution across order lines
    invoicesWithNoLines.forEach(inv => {
      // Derive quantity from invoice total / unit price
      const derivedQty = Math.round(inv.total / lineItem.unitPrice);
      invoicedQty += Math.min(derivedQty, orderQty); // Cap at order qty
    });
  }

  if (invoicedQty === 0 && linkedInvoices.length === 0) {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  } else if (invoicedQty < orderQty) {
    return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' };
  } else if (invoicedQty >= orderQty) {
    return { label: 'Complete', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  }
};

// Helper function to get linked commission checks for an invoice
const getLinkedChecksForInvoice = (
  invoiceId: string,
  allChecks: CommissionCheck[]
): CommissionCheck[] => {
  return allChecks.filter(check =>
    check.details.some(detail => detail.type === 'invoice' && detail.referenceId === invoiceId)
  );
};

// Helper function to get overall order shipping status
const getOrderShipStatus = (lineItems: { quantity: number; quantityShipped: number; partNumber?: string; isCredit?: boolean }[]): { label: string; color: string } => {
  // Filter out freight lines and credit lines
  const productLines = lineItems.filter(item => item.partNumber !== 'FREIGHT' && !item.isCredit);
  if (productLines.length === 0) return { label: 'No Items', color: 'bg-gray-100 text-gray-700' };

  const totalQty = productLines.reduce((sum, item) => sum + item.quantity, 0);
  const totalShipped = productLines.reduce((sum, item) => sum + item.quantityShipped, 0);

  if (totalShipped === 0) {
    return { label: 'Not Shipped', color: 'bg-gray-100 text-gray-700' };
  } else if (totalShipped < totalQty) {
    return { label: 'Partial Shipped', color: 'bg-yellow-100 text-yellow-700' };
  } else if (totalShipped === totalQty) {
    return { label: 'Shipped Complete', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: 'Overshipped', color: 'bg-red-100 text-red-700' };
  }
};

// Available reps
const availableOutsideReps = [
  { id: 'or-1', name: 'Richard Utley' },
  { id: 'or-2', name: 'Mike Thompson' },
  { id: 'or-3', name: 'Sarah Williams' },
  { id: 'or-4', name: 'Tom Davis' },
  { id: 'or-5', name: 'Chris Martin' },
];

const availableInsideReps = [
  { id: 'ir-1', name: 'Jennifer Adams' },
  { id: 'ir-2', name: 'Mark Stevens' },
  { id: 'ir-3', name: 'Rachel Green' },
  { id: 'ir-4', name: 'David Miller' },
  { id: 'ir-5', name: 'Emily Chen' },
];

export default function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [fulfillmentOrders, setFulfillmentOrders] = useState<FulfillmentOrder[]>(mockFulfillmentOrders);
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(defaultVisibleColumns));
  const [pinnedColumns, setPinnedColumns] = useState<Set<ColumnKey>>(new Set());
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Invoice tooltip state
  const [invoiceTooltip, setInvoiceTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    invoices: Invoice[];
  }>({ visible: false, x: 0, y: 0, invoices: [] });
  const [portalMounted, setPortalMounted] = useState(false);

  // Ensure portal is only rendered on client side
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Line item bulk actions state
  const [showLineItemsBulkActionsMenu, setShowLineItemsBulkActionsMenu] = useState(false);
  const [showLineCreditModal, setShowLineCreditModal] = useState(false);
  const [showLineAcknowledgementModal, setShowLineAcknowledgementModal] = useState(false);
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [showSetOutsideRepSplitsModal, setShowSetOutsideRepSplitsModal] = useState(false);
  const [bulkOveragePercent, setBulkOveragePercent] = useState('');
  const [bulkEndUser, setBulkEndUser] = useState('');

  // Warehouse conversion state
  const [showWarehouseConversionModal, setShowWarehouseConversionModal] = useState(false);
  const [warehouseConversionMode, setWarehouseConversionMode] = useState<'all' | 'selected'>('all');
  const [productsToConvert, setProductsToConvert] = useState<{id: string; partNumber: string; isAlreadyWarehouse: boolean}[]>([]);

  // Fulfillment request state
  const [showFulfillmentRequestModal, setShowFulfillmentRequestModal] = useState(false);
  const [fulfillmentRequestMode, setFulfillmentRequestMode] = useState<'all' | 'selected'>('all');
  const [lineItemsForFulfillment, setLineItemsForFulfillment] = useState<{id: string; partNumber: string; quantity: number; hasExistingRequest: boolean}[]>([]);

  // Credit modal state
  const [creditName, setCreditName] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toLocaleDateString('en-US'));
  const [creditNote, setCreditNote] = useState('');
  const [creditLineItems, setCreditLineItems] = useState<{
    partNumber: string;
    linkedLineItemId: string | null; // null = order-level credit (not taggable to a line item)
    creditType: '' | 'return' | 'short_ship' | 'cancel' | 'damage'; // empty = not selected (required)
    quantity: number; // Always negative for credits
    unitPrice: number;
    creditAmount: number; // quantity * unitPrice (will be negative)
    commissionPercent: number;
    commissionAmount: number;
  }[]>([]);

  // Acknowledgement modal state
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackLineItems, setAckLineItems] = useState<{lineId: string; partNumber: string; orderedQty: number; acknowledgedQty: number; shipDate: string}[]>([]);

  // Mock data for line item acknowledgements (in real app, this would be part of the order data)
  const [lineItemAcknowledgements] = useState<Record<string, { ackNumber: string; shipDate: string; acknowledgedQty: number }>>({
    // Order 001
    'OLI-001-1': { ackNumber: 'ACK-2024-010', shipDate: '2024-12-15', acknowledgedQty: 50 },
    // Order 002
    'OLI-002-1': { ackNumber: 'ACK-2024-011', shipDate: '2024-12-18', acknowledgedQty: 75 },
    'OLI-002-2': { ackNumber: 'ACK-2024-011', shipDate: '2024-12-18', acknowledgedQty: 30 },
    // Order 003
    'OLI-003-1': { ackNumber: 'ACK-2024-012', shipDate: '2024-12-20', acknowledgedQty: 100 },
    // Order 004
    'OLI-004-1': { ackNumber: 'ACK-2024-013', shipDate: '2024-12-22', acknowledgedQty: 200 },
    // Order 005
    'OLI-005-1': { ackNumber: 'ACK-2024-001', shipDate: '2024-12-20', acknowledgedQty: 100 },
    'OLI-005-2': { ackNumber: 'ACK-2024-004', shipDate: '2024-12-28', acknowledgedQty: 30 },  // Partial: 30 of 45 acknowledged
    'OLI-005-3': { ackNumber: 'ACK-2024-002', shipDate: '2024-12-22', acknowledgedQty: 200 },
    'OLI-005-4': { ackNumber: 'ACK-2024-003', shipDate: '2024-12-18', acknowledgedQty: 30 },
    // Order 006
    'OLI-006-1': { ackNumber: 'ACK-2024-014', shipDate: '2024-12-25', acknowledgedQty: 150 },
  });

  // Mock data for line item credits (in real app, this would be part of the order data)
  const [lineItemCredits] = useState<Record<string, { creditName: string; creditType: string; creditQty: number; originalQty: number; originalTotal: number }>>({
    // Order 001
    'OLI-001-2': { creditName: 'CR-2024-010', creditType: 'Short Ship', creditQty: 3, originalQty: 25, originalTotal: 4125 },
    // Order 003
    'OLI-003-2': { creditName: 'CR-2024-011', creditType: 'Cancel', creditQty: 10, originalQty: 40, originalTotal: 8800 },
    // Order 005 - quantities reflect post-credit values (original - credit)
    'OLI-005-2': { creditName: 'CR-2024-001', creditType: 'Return', creditQty: 5, originalQty: 50, originalTotal: 7250 },  // Now shows 45 qty, $6,525
    'OLI-005-5': { creditName: 'CR-2024-002', creditType: 'Damage', creditQty: 2, originalQty: 15, originalTotal: 6750 },  // Now shows 13 qty, $5,850
    // Order 006
    'OLI-006-1': { creditName: 'CR-2024-015', creditType: 'Return', creditQty: 10, originalQty: 150, originalTotal: 24750 },
  });

  // Views state
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [activeView, setActiveView] = useState('default');
  const savedViews = [
    { id: 'default', name: 'Default', columns: defaultVisibleColumns },
    { id: 'compact', name: 'Compact', columns: ['partNumber', 'description', 'quantity', 'sellTotal'] as ColumnKey[] },
    { id: 'overage', name: 'Overage View', columns: ['quantity', 'uom', 'unitPrice', 'percentOver', 'sellTotal', 'commissionPercent', 'commissionAmount', 'ovgPercent', 'ovgAmount', 'earnPercent', 'earnAmount'] as ColumnKey[] },
    { id: 'full', name: 'Full Details', columns: Object.keys(columnLabels) as ColumnKey[] },
  ];

  // Sections state
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<'column' | 'lineShelf'>('column');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<{version: number; date: string; isLatest: boolean}[]>([
    { version: 1, date: '12/14/2024', isLatest: true }
  ]);

  // View mode state (header dropdown)
  const [viewMode, setViewMode] = useState<'simple' | 'overage'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Settings state
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showOutsideRepPerLine, setShowOutsideRepPerLine] = useState(false);
  const [showInsideRepPerLine, setShowInsideRepPerLine] = useState(false);
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<'soldTo' | 'endUser'>('soldTo');

  // Outside rep state
  const [orderOutsideRep, setOrderOutsideRep] = useState<string>('');
  const [splitOutsideCommission, setSplitOutsideCommission] = useState(false);
  const [showOutsideRepSplitsModal, setShowOutsideRepSplitsModal] = useState(false);
  const [outsideRepSplits, setOutsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Inside rep state
  const [orderInsideRep, setOrderInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepSplits, setInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Quote lookup modal state
  const [showQuoteLookupModal, setShowQuoteLookupModal] = useState(false);
  const [quoteLookupPartNumber, setQuoteLookupPartNumber] = useState('');
  const [quoteLookupQuoteNumber, setQuoteLookupQuoteNumber] = useState('');
  const [quoteLookupStartDate, setQuoteLookupStartDate] = useState('12/2024');
  const [quoteLookupEndDate, setQuoteLookupEndDate] = useState('12/2025');
  const [quoteLookupOpenOnly, setQuoteLookupOpenOnly] = useState(false);
  const [quoteLookupBlanketOnly, setQuoteLookupBlanketOnly] = useState(false);

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

  // Freight line state - check if order already has a freight line
  const hasFreightLine = useMemo(() => {
    return order?.lineItems.some(item => item.partNumber === 'FREIGHT') || false;
  }, [order]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // Line item selection functions
  const toggleLineItemSelection = (itemId: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleAllLineItems = () => {
    if (!order) return;
    if (selectedLineItems.size === order.lineItems.length) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(new Set(order.lineItems.map(i => i.id)));
    }
  };

  // Warehouse conversion functions
  const handleMakeWarehouseOrder = () => {
    if (!order) return;

    // Only check non-credit line items
    const productLineItems = order.lineItems.filter(item => !item.isCredit);
    const productsInfo = productLineItems.map(item => ({
      id: item.id,
      partNumber: item.partNumber || '',
      isAlreadyWarehouse: item.isWarehouseConsignment ?? false,
    }));

    // Check if any non-warehouse products exist
    const nonWarehouseProducts = productsInfo.filter(p => !p.isAlreadyWarehouse);

    if (nonWarehouseProducts.length > 0) {
      // Show modal to confirm conversion
      setProductsToConvert(productsInfo);
      setWarehouseConversionMode('all');
      setShowWarehouseConversionModal(true);
    } else {
      // All products are already warehouse products
      alert('All products are already marked as warehouse products.');
    }
    setShowActionsDropdown(false);
  };

  const handleBulkConvertToWarehouse = () => {
    if (!order || selectedLineItems.size === 0) return;

    // Get selected line items (exclude credits)
    const selectedItems = order.lineItems.filter(item => selectedLineItems.has(item.id) && !item.isCredit);
    const productsInfo = selectedItems.map(item => ({
      id: item.id,
      partNumber: item.partNumber || '',
      isAlreadyWarehouse: item.isWarehouseConsignment ?? false,
    }));

    // Check if any non-warehouse products exist
    const nonWarehouseProducts = productsInfo.filter(p => !p.isAlreadyWarehouse);

    if (nonWarehouseProducts.length > 0) {
      // Show modal to confirm conversion
      setProductsToConvert(productsInfo);
      setWarehouseConversionMode('selected');
      setShowWarehouseConversionModal(true);
    } else {
      // All selected products are already warehouse products
      alert('All selected products are already marked as warehouse products.');
    }
    setShowLineItemsBulkActionsMenu(false);
  };

  const confirmWarehouseConversion = () => {
    if (!order) return;

    // Get IDs to convert
    const idsToConvert = productsToConvert.filter(p => !p.isAlreadyWarehouse).map(p => p.id);

    // Update the order line items
    setOrders(prev => prev.map(ord => {
      if (ord.id !== order.id) return ord;
      return {
        ...ord,
        lineItems: ord.lineItems.map(item => {
          if (idsToConvert.includes(item.id)) {
            return {
              ...item,
              isWarehouseConsignment: true,
              inventoryOnHand: 0, // Default to 0, would be fetched from actual inventory
            };
          }
          return item;
        }),
      };
    }));

    setShowWarehouseConversionModal(false);
    setProductsToConvert([]);
    setSelectedLineItems(new Set());
  };

  // Fulfillment request functions
  const handleGenerateFulfillmentRequest = () => {
    if (!order) return;

    // Only include warehouse products (non-credit line items) that don't already have requests
    const warehouseLineItems = order.lineItems.filter(
      item => !item.isCredit && item.isWarehouseConsignment && !item.fulfillmentRequestId
    );

    if (warehouseLineItems.length === 0) {
      // Check if there are warehouse products at all
      const allWarehouseItems = order.lineItems.filter(item => !item.isCredit && item.isWarehouseConsignment);
      if (allWarehouseItems.length === 0) {
        alert('No warehouse products found. Only warehouse products can have fulfillment requests.');
      } else {
        alert('All warehouse products already have fulfillment requests.');
      }
      setShowActionsDropdown(false);
      return;
    }

    // Create the fulfillment order directly (no modal)
    const existingCount = fulfillmentOrders.length;
    const newFulfillmentOrderNumber = `FO-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`;
    const newFulfillmentOrderId = `fo-${Date.now()}`;
    const now = new Date().toISOString();

    // Use first warehouse for now
    const defaultWarehouse = mockWarehouses[0];

    // Create fulfillment order line items
    const fulfillmentLineItems: FulfillmentOrderLineItem[] = warehouseLineItems.map((item, idx) => ({
      id: `foli-${Date.now()}-${idx}`,
      fulfillmentOrderId: newFulfillmentOrderId,
      orderLineItemId: item.id,
      productId: item.productId || '',
      productName: item.description || '',
      partNumber: item.partNumber || '',
      uom: 'EA',
      orderedQty: item.quantity,
      allocatedQty: item.quantity,
      shippedQty: 0,
      backorderQty: 0,
      createdAt: now,
      updatedAt: now,
    }));

    // Create the fulfillment order
    const newFulfillmentOrder: FulfillmentOrder = {
      id: newFulfillmentOrderId,
      fulfillmentOrderNumber: newFulfillmentOrderNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId || '',
      customerName: order.customerName || '',
      warehouseId: defaultWarehouse.id,
      warehouseName: defaultWarehouse.name,
      fulfillmentMethod: 'SHIP',
      shipTo: {
        name: order.customerName || '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
      },
      needByDate: order.dueDate,
      allowPartialShipment: true, // Default to allowing partial shipment
      shipStatus: 'NOT_SHIPPED',
      status: 'PENDING', // Start as PENDING - user must release via action
      lineItems: fulfillmentLineItems,
      createdAt: now,
      updatedAt: now,
      createdBy: 'Current User',
    };

    // Add to shared mock data (mutates the array so it persists across components)
    addFulfillmentOrder(newFulfillmentOrder);

    // Also update local state
    setFulfillmentOrders(prev => [...prev, newFulfillmentOrder]);

    // Update order line items with fulfillment reference
    const idsToUpdate = warehouseLineItems.map(item => item.id);
    setOrders(prev => prev.map(ord => {
      if (ord.id !== order.id) return ord;
      return {
        ...ord,
        lineItems: ord.lineItems.map(item => {
          if (idsToUpdate.includes(item.id)) {
            return {
              ...item,
              fulfillmentRequestId: newFulfillmentOrderId,
              fulfillmentRequestNumber: newFulfillmentOrderNumber,
              fulfillmentRequestStatus: 'pending' as const,
            };
          }
          return item;
        }),
      };
    }));

    setShowActionsDropdown(false);

    // Navigate directly to the fulfillment order
    router.push(`/warehouse/fulfillment/${newFulfillmentOrderId}`);
  };

  const handleBulkGenerateFulfillmentRequest = () => {
    if (!order || selectedLineItems.size === 0) return;

    // Get selected warehouse line items (exclude credits)
    const selectedWarehouseItems = order.lineItems.filter(
      item => selectedLineItems.has(item.id) && !item.isCredit && item.isWarehouseConsignment
    );

    if (selectedWarehouseItems.length === 0) {
      alert('No warehouse products selected. Only warehouse products can have fulfillment requests.');
      setShowLineItemsBulkActionsMenu(false);
      return;
    }

    const itemsInfo = selectedWarehouseItems.map(item => ({
      id: item.id,
      partNumber: item.partNumber || '',
      quantity: item.quantity,
      hasExistingRequest: !!item.fulfillmentRequestId,
    }));

    // Check if any items don't have existing requests
    const itemsWithoutRequest = itemsInfo.filter(item => !item.hasExistingRequest);

    if (itemsWithoutRequest.length === 0) {
      alert('All selected warehouse products already have fulfillment requests.');
      setShowLineItemsBulkActionsMenu(false);
      return;
    }

    setLineItemsForFulfillment(itemsInfo);
    setFulfillmentRequestMode('selected');
    setShowFulfillmentRequestModal(true);
    setShowLineItemsBulkActionsMenu(false);
  };

  const confirmFulfillmentRequest = () => {
    if (!order) return;

    // Get IDs to add fulfillment request (only those without existing requests)
    const idsToUpdate = lineItemsForFulfillment.filter(item => !item.hasExistingRequest).map(item => item.id);

    // Get line items that will be included in this fulfillment order
    const lineItemsToInclude = order.lineItems.filter(item => idsToUpdate.includes(item.id));

    if (lineItemsToInclude.length === 0) return;

    // Generate fulfillment order number with sequential numbering
    const existingCount = fulfillmentOrders.length;
    const newFulfillmentOrderNumber = `FO-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`;
    const newFulfillmentOrderId = `fo-${Date.now()}`;
    const now = new Date().toISOString();

    // Use first warehouse for now (in real app, would allow selection)
    const defaultWarehouse = mockWarehouses[0];

    // Create fulfillment order line items
    const fulfillmentLineItems: FulfillmentOrderLineItem[] = lineItemsToInclude.map((item, idx) => ({
      id: `foli-${Date.now()}-${idx}`,
      fulfillmentOrderId: newFulfillmentOrderId,
      orderLineItemId: item.id,
      productId: item.productId || '',
      productName: item.description || '',
      partNumber: item.partNumber || '',
      uom: 'EA', // Default unit of measure
      orderedQty: item.quantity,
      allocatedQty: item.quantity,
      shippedQty: 0,
      backorderQty: 0,
      createdAt: now,
      updatedAt: now,
    }));

    // Create the fulfillment order
    const newFulfillmentOrder: FulfillmentOrder = {
      id: newFulfillmentOrderId,
      fulfillmentOrderNumber: newFulfillmentOrderNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId || '',
      customerName: order.customerName || '',
      warehouseId: defaultWarehouse.id,
      warehouseName: defaultWarehouse.name,
      fulfillmentMethod: 'SHIP',
      shipTo: {
        name: order.customerName || '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
      },
      needByDate: order.dueDate,
      allowPartialShipment: true, // Default to allowing partial shipment
      shipStatus: 'NOT_SHIPPED',
      status: 'PENDING', // Start as PENDING - user must release via action
      lineItems: fulfillmentLineItems,
      createdAt: now,
      updatedAt: now,
      createdBy: 'Current User',
    };

    // Add the new fulfillment order to state
    setFulfillmentOrders(prev => [...prev, newFulfillmentOrder]);

    // Update the order line items with the fulfillment reference
    setOrders(prev => prev.map(ord => {
      if (ord.id !== order.id) return ord;
      return {
        ...ord,
        lineItems: ord.lineItems.map(item => {
          if (idsToUpdate.includes(item.id)) {
            return {
              ...item,
              fulfillmentRequestId: newFulfillmentOrderId,
              fulfillmentRequestNumber: newFulfillmentOrderNumber,
              fulfillmentRequestStatus: 'pending' as const,
            };
          }
          return item;
        }),
      };
    }));

    setShowFulfillmentRequestModal(false);
    setLineItemsForFulfillment([]);
    setSelectedLineItems(new Set());

    // Navigate to the new fulfillment order
    router.push(`/warehouse/fulfillment/${newFulfillmentOrderId}`);
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (order) {
      setEditedSplits([...order.splitRates]);
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
    if (order) {
      updated[index].commissionAmount = (order.totalCommission * newPercentage) / 100;
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
    const rep = mockSalesReps.find(r => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = { ...updated[index], salesRepId: repId, salesRepName: rep.name };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (order) {
      const totalPercentage = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedOrder = {
        ...order,
        splitRates: editedSplits,
      };
      setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);

  // Calculate totals
  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, freight: 0, total: 0, commission: 0, totalOvg: 0, totalEarn: 0 };
    // Calculate overage totals from non-freight line items
    const productLines = order.lineItems.filter(item => item.partNumber !== 'FREIGHT');
    const totalCommission = productLines.reduce((sum, item) => sum + (item.extendedPrice * (item.commissionRate || 0.08)), 0);
    const totalOvg = productLines.reduce((sum, item) => sum + (item.unitPrice * 0.15 * item.quantity * 0.85), 0);
    const totalEarn = totalCommission + totalOvg;
    return {
      subtotal: order.subtotal,
      freight: order.freight,
      total: order.total,
      commission: order.totalCommission,
      totalOvg,
      totalEarn,
    };
  }, [order]);

  // Mock activity data
  const activities = [
    { id: 1, type: 'created', user: 'System', description: 'Order created', date: order?.orderDate || '' },
    { id: 2, type: 'status', user: 'John Smith', description: 'Status changed to Confirmed', date: order?.orderDate || '' },
  ];

  // Column toggle handler
  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(col)) {
        newSet.delete(col);
        // Also unpin if hidden
        setPinnedColumns(prevPinned => {
          const newPinned = new Set(prevPinned);
          newPinned.delete(col);
          return newPinned;
        });
      } else {
        newSet.add(col);
      }
      return newSet;
    });
  };

  // Column pin toggle handler
  const togglePinColumn = (col: ColumnKey) => {
    setPinnedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(col)) {
        newSet.delete(col);
      } else {
        newSet.add(col);
      }
      return newSet;
    });
  };

  // Get pinned column styles (for sticky positioning)
  const getPinnedColumnStyle = (colKey: ColumnKey): React.CSSProperties => {
    if (!pinnedColumns.has(colKey)) return {};

    // Calculate left offset based on which columns are pinned before this one
    // Fixed columns: checkbox (40px) + icons (variable)
    const fixedLeftOffset = 40; // checkbox width
    const iconColWidth = (visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) ? 120 : 0;

    // Get ordered list of visible pinned columns
    const allColumns: ColumnKey[] = Object.keys(columnLabels) as ColumnKey[];
    const visiblePinnedColumns = allColumns.filter(col => visibleColumns.has(col) && pinnedColumns.has(col));

    const colIndex = visiblePinnedColumns.indexOf(colKey);
    if (colIndex === -1) return {};

    // Estimate column widths (approximate)
    const columnWidths: Partial<Record<ColumnKey, number>> = {
      partNumber: 120,
      custPartNumber: 100,
      description: 200,
      uom: 60,
      divisor: 70,
      unitPrice: 100,
      quantity: 60,
      shippedQty: 90,
      lineStatus: 100,
      linkedQuote: 100,
      linkedInvoice: 120,
      linkedCheck: 120,
      linkedFulfillment: 120,
      sellTotal: 100,
      commissionPercent: 100,
      commission: 100,
      commissionTotal: 120,
      invoiced: 80,
      percentOver: 80,
      commissionAmount: 80,
      ovgPercent: 80,
      ovgAmount: 80,
      earnPercent: 80,
      earnAmount: 80,
      iconAcknowledgement: 30,
      iconDocumentSpecific: 30,
      iconWarehouse: 30,
      iconCredit: 30,
    };

    let leftOffset = fixedLeftOffset + iconColWidth;
    for (let i = 0; i < colIndex; i++) {
      leftOffset += columnWidths[visiblePinnedColumns[i]] || 100;
    }

    return {
      position: 'sticky' as const,
      left: leftOffset,
      zIndex: 10,
      backgroundColor: 'var(--card)',
    };
  };

  // Check if a column is pinned
  const isPinned = (colKey: ColumnKey) => pinnedColumns.has(colKey);

  // Get ordered columns - pinned columns first, then unpinned
  const getOrderedColumns = (): ColumnKey[] => {
    const allColumns: ColumnKey[] = Object.keys(columnLabels) as ColumnKey[];
    const visibleCols = allColumns.filter(col => visibleColumns.has(col));
    const pinnedCols = visibleCols.filter(col => pinnedColumns.has(col));
    const unpinnedCols = visibleCols.filter(col => !pinnedColumns.has(col));
    return [...pinnedCols, ...unpinnedCols];
  };

  const orderedColumns = getOrderedColumns();

  // Get status color for the stage dropdown button
  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-blue-100 text-blue-700',
      partial_shipped: 'bg-orange-100 text-orange-700',
      shipped: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      dormant: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!order) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Order not found</h2>
          <p className="text-[var(--muted-foreground)] mt-2">The order you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header - Matching Quotes Simple View */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders')}
                className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
                title="Back to Orders"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{order.orderNumber}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowActionsDropdown(!showActionsDropdown);
                  setShowStatusDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Actions
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showActionsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      router.push(`/invoices?order=${order.id}`);
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create Invoice
                  </button>
                  <button
                    onClick={() => {
                      alert('Duplicate order');
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                      <path d="M4 14V4a2 2 0 012-2h10"/>
                    </svg>
                    Duplicate Order
                  </button>
                  <button
                    onClick={() => {
                      setShowQuoteLookupModal(true);
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add New Lines from Quotes
                  </button>
                  <div className="border-t border-[var(--border)]" />
                  <button
                    onClick={handleMakeWarehouseOrder}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2 text-teal-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h14l-1.5 9H4.5L3 7z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Convert Products to Warehouse
                  </button>
                </div>
              )}
            </div>

            {/* Fulfillment Request Button - only shows if there are warehouse products */}
            {order.lineItems.some(item => item.isWarehouseConsignment && !item.isCredit) && (
              <button
                onClick={handleGenerateFulfillmentRequest}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12h8M8 16h5" strokeLinecap="round"/>
                </svg>
                Fulfillment Request
              </button>
            )}

            {/* Status Dropdown - styled like a button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowActionsDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(order.status)}`}
              >
                {orderStatusLabels[order.status]}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {(['draft', 'open', 'partial_shipped', 'shipped', 'cancelled', 'dormant'] as Order['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setOrders(orders.map(o => o.id === order.id ? { ...o, status } : o));
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        order.status === status ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      {orderStatusLabels[status]}
                      {order.status === status && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Version Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowVersionDropdown(!showVersionDropdown);
                  setShowActionsDropdown(false);
                  setShowStatusDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                v{currentVersion}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showVersionDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVersionDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                    {availableVersions.map((v) => (
                      <button
                        key={v.version}
                        onClick={() => {
                          setCurrentVersion(v.version);
                          setShowVersionDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                          currentVersion === v.version ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>v{v.version}</span>
                          {v.isLatest && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Latest</span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{v.date}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View Mode Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowViewModeDropdown(!showViewModeDropdown);
                  setShowActionsDropdown(false);
                  setShowStatusDropdown(false);
                  setShowVersionDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="3"/>
                </svg>
                {viewMode === 'simple' ? 'Simple View' : 'Overage View'}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showViewModeDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowViewModeDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => {
                        setViewMode('simple');
                        setVisibleColumns(new Set(defaultVisibleColumns));
                        setActiveView('default');
                        setShowViewModeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center justify-between ${
                        viewMode === 'simple' ? 'text-[var(--primary)] font-medium' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="14" height="14" rx="2"/>
                          <path d="M3 8h14"/>
                        </svg>
                        Simple View
                      </span>
                      {viewMode === 'simple' && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('overage');
                        setVisibleColumns(new Set(['quantity', 'uom', 'unitPrice', 'percentOver', 'sellTotal', 'commissionPercent', 'commissionAmount', 'ovgPercent', 'ovgAmount', 'earnPercent', 'earnAmount'] as ColumnKey[]));
                        setActiveView('overage');
                        setShowViewModeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center justify-between ${
                        viewMode === 'overage' ? 'text-[var(--primary)] font-medium' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v6l4-2-4-2z" fill="currentColor"/>
                          <path d="M2 10h16M2 6h8M2 14h12"/>
                        </svg>
                        Overage View
                      </span>
                      {viewMode === 'overage' && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Generate PDF Button */}
            <button
              onClick={() => alert('Generate PDF')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
              </svg>
              PDF
            </button>

            {/* Save Button with Dropdown */}
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => alert('Order saved!')}
                  className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDropdown(!showSaveDropdown);
                    setShowActionsDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                  className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {showSaveDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSaveDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => { alert('Order saved!'); setShowSaveDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        const newVersion = Math.max(...availableVersions.map(v => v.version)) + 1;
                        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                        setAvailableVersions(prev => [
                          ...prev.map(v => ({ ...v, isLatest: false })),
                          { version: newVersion, date: today, isLatest: true }
                        ]);
                        setCurrentVersion(newVersion);
                        setShowSaveDropdown(false);
                        alert(`Saved as version ${newVersion}`);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Save as New Version
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-between">
        {/* Shipping Status */}
        <div className="flex items-center gap-2">
          {order && (() => {
            const shipStatus = getOrderShipStatus(order.lineItems);
            return (
              <>
                <span className="text-xs text-[var(--muted-foreground)]">Ship Status:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${shipStatus.color}`}>
                  {shipStatus.label}
                </span>
              </>
            );
          })()}
        </div>
        {/* Totals */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--muted-foreground)]">
            Subtotal: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.subtotal)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Freight: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.freight)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Total: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.total)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Commission: <span className="font-medium text-purple-600">{formatCurrency(totals.commission)}</span>
          </span>
          {viewMode === 'overage' && (
            <>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-[var(--muted-foreground)]">
                Ovg $: <span className="font-medium text-orange-500">{formatCurrency(totals.totalOvg)}</span>
              </span>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-[var(--muted-foreground)]">
                Earn $: <span className="font-semibold text-green-600">{formatCurrency(totals.totalEarn)}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Order Details Section */}
      <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
        <button
          onClick={() => setShowHeaderFields(!showHeaderFields)}
          className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
        >
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {showHeaderFields ? 'Order Details' : 'Show Order Details'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--muted-foreground)] transition-transform ${showHeaderFields ? '' : 'rotate-180'}`}
          >
            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showHeaderFields && (
          <div className="px-6 pb-4">
            {/* Row 1: Order Number, Factory, Sold To Customer, Bill To Customer, Order Date, Due Date */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Order Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={order.orderNumber}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Factory<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={order.manufacturerName}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value={order.manufacturerName}>{order.manufacturerName}</option>
                    <option value="ERMCO">ERMCO</option>
                    <option value="Acuity Brands">Acuity Brands</option>
                    <option value="Eaton">Eaton</option>
                    <option value="Schneider Electric">Schneider Electric</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Sold To Customer<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={order.customerName}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value={order.customerName}>{order.customerName}</option>
                    <option value="Turner Construction">Turner Construction</option>
                    <option value="Hensel Phelps">Hensel Phelps</option>
                    <option value="Skanska USA">Skanska USA</option>
                    <option value="DPR Construction">DPR Construction</option>
                    <option value="Clark Construction">Clark Construction</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Bill To Customer<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value=""
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value="">Select...</option>
                    <option value="Graybar Electric">Graybar Electric</option>
                    <option value="HD Supply">HD Supply</option>
                    <option value="Ferguson Enterprises">Ferguson Enterprises</option>
                    <option value="Rexel USA">Rexel USA</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Order Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(order.orderDate)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Due Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={order.dueDate ? formatDate(order.dueDate) : 'mm/dd/yyyy'}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 2: Order Type, Job, Shipping Terms, Payment Terms, Mark #, Projected Ship Date */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Order Type<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value="NORMAL"
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="RUSH">RUSH</option>
                    <option value="BLANKET">BLANKET</option>
                    <option value="STOCK">STOCK</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Job
                </label>
                <input
                  type="text"
                  value={order.jobName || ''}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Shipping Terms
                </label>
                <input
                  type="text"
                  value=""
                  placeholder=""
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value="30"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Mark #
                </label>
                <input
                  type="text"
                  value=""
                  placeholder=""
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Projected Ship Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={order.shipDate ? formatDate(order.shipDate) : order.requestedShipDate ? formatDate(order.requestedShipDate) : ''}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 3: SO Number */}
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  SO Number
                </label>
                <input
                  type="text"
                  value={order.factorySoNumber || ''}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Outside Rep
                </label>
                <div className="relative">
                  <select
                    value={orderOutsideRep}
                    onChange={(e) => {
                      setOrderOutsideRep(e.target.value);
                      if (!e.target.value) {
                        setSplitOutsideCommission(false);
                        setOutsideRepSplits([]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  >
                    <option value="">Select Rep...</option>
                    {availableOutsideReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {orderOutsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitOutsideCommission"
                      checked={splitOutsideCommission}
                      onChange={(e) => {
                        setSplitOutsideCommission(e.target.checked);
                        if (e.target.checked) {
                          const rep = availableOutsideReps.find(r => r.id === orderOutsideRep);
                          if (rep) {
                            setOutsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                          }
                          setShowOutsideRepSplitsModal(true);
                        } else {
                          setOutsideRepSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitOutsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split
                    </label>
                    {splitOutsideCommission && outsideRepSplits.length > 0 && (
                      <button
                        onClick={() => setShowOutsideRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({outsideRepSplits.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Inside Rep
                </label>
                <div className="relative">
                  <select
                    value={orderInsideRep}
                    onChange={(e) => {
                      setOrderInsideRep(e.target.value);
                      if (!e.target.value) {
                        setSplitInsideCommission(false);
                        setInsideRepSplits([]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  >
                    <option value="">Select Rep...</option>
                    {availableInsideReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {orderInsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitInsideCommission"
                      checked={splitInsideCommission}
                      onChange={(e) => {
                        setSplitInsideCommission(e.target.checked);
                        if (e.target.checked) {
                          const rep = availableInsideReps.find(r => r.id === orderInsideRep);
                          if (rep) {
                            setInsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                          }
                          setShowInsideRepSplitsModal(true);
                        } else {
                          setInsideRepSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitInsideCommission" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split
                    </label>
                    {splitInsideCommission && insideRepSplits.length > 0 && (
                      <button
                        onClick={() => setShowInsideRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({insideRepSplits.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {[
                { id: 'line-items', label: 'Line Items', count: order.lineItems.length },
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
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
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

            {/* View Controls - on tab row */}
            {activeTab === 'line-items' && (
              <div className="flex items-center gap-3 pb-2">
                {/* Views Dropdown (Custom) */}
                <div className="relative">
                  <button
                    onClick={() => setShowViewsMenu(!showViewsMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M8 8v9"/>
                    </svg>
                    {savedViews.find(v => v.id === activeView)?.name || 'Custom'}
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showViewsMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowViewsMenu(false)} />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                        <div className="p-2 border-b border-[var(--border)]">
                          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Saved Views</p>
                        </div>
                        {savedViews.map(view => (
                          <button
                            key={view.id}
                            onClick={() => {
                              setVisibleColumns(new Set(view.columns));
                              setActiveView(view.id);
                              setShowViewsMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                              activeView === view.id ? 'text-[var(--primary)] font-medium' : ''
                            }`}
                          >
                            {view.name}
                            {activeView === view.id && (
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
                  onClick={() => setShowSectionsModal(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    showSections
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
                  onClick={() => setShowColumnsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                  </svg>
                  Columns
                  <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{visibleColumns.size}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'line-items' && (
            <div className="space-y-4">
              {/* Bulk Actions Bar for Line Items */}
              {selectedLineItems.size > 0 && (
                <div className="px-4 py-2 bg-[var(--primary)]/5 border border-[var(--border)] rounded-lg flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground)]">
                    <strong>{selectedLineItems.size}</strong> line item{selectedLineItems.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowLineItemsBulkActionsMenu(!showLineItemsBulkActionsMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                      >
                        Bulk Actions
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showLineItemsBulkActionsMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowLineItemsBulkActionsMenu(false)} />
                          <div className="fixed right-[200px] top-1/2 -translate-y-1/2 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                            <button
                              onClick={() => {
                                setShowSetOverageModal(true);
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Overage %
                            </button>
                            <button
                              onClick={() => {
                                // Lock overage for selected line items
                                alert('Overage locked for selected items');
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Lock Overage
                            </button>
                            <button
                              onClick={() => {
                                // Unlock overage for selected line items
                                alert('Overage unlocked for selected items');
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Unlock Overage
                            </button>
                            <button
                              onClick={() => {
                                setShowSetEndUserModal(true);
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set End User
                            </button>
                            <button
                              onClick={() => {
                                setShowSetOutsideRepSplitsModal(true);
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Outside Rep Splits
                            </button>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button
                              onClick={handleBulkConvertToWarehouse}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-teal-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 7h14l-1.5 9H4.5L3 7z" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Convert to Warehouse
                            </button>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button
                              onClick={() => {
                                // Initialize credit line items from selected line items (tagged to line items)
                                const items = order.lineItems.filter(li => selectedLineItems.has(li.id)).map(li => ({
                                  partNumber: li.partNumber || '',
                                  linkedLineItemId: li.id, // Tagged to this line item
                                  creditType: '' as const, // Required - user must select
                                  quantity: 0, // User must input credit quantity
                                  unitPrice: li.unitPrice,
                                  creditAmount: 0,
                                  commissionPercent: (li.commissionRate || 0.08) * 100,
                                  commissionAmount: 0,
                                }));
                                setCreditLineItems(items);
                                setCreditName('');
                                setCreditNote('');
                                setShowLineCreditModal(true);
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-green-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="10" cy="10" r="8"/>
                                <path d="M7 10h6M10 7v6" strokeLinecap="round"/>
                              </svg>
                              Add Credit
                            </button>
                            <button
                              onClick={() => {
                                // Initialize acknowledgement line items from selected line items
                                const items = order.lineItems.filter(li => selectedLineItems.has(li.id)).map(li => ({
                                  lineId: li.id,
                                  partNumber: li.partNumber || '',
                                  orderedQty: li.quantity,
                                  acknowledgedQty: li.quantity,
                                  shipDate: ''
                                }));
                                setAckLineItems(items);
                                setShowLineAcknowledgementModal(true);
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-blue-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Add Order Acknowledgement
                            </button>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button
                              onClick={() => {
                                // Delete selected line items
                                setOrders(orders.map(o =>
                                  o.id === order.id
                                    ? { ...o, lineItems: o.lineItems.filter(li => !selectedLineItems.has(li.id)) }
                                    : o
                                ));
                                setSelectedLineItems(new Set());
                                setShowLineItemsBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v6M12 10v6M5 6l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Delete Lines
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedLineItems(new Set())}
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
              {/* Line Items Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                    <tr>
                      {/* Checkbox column */}
                      <th className="w-10 px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={order.lineItems.length > 0 && order.lineItems.every(item => selectedLineItems.has(item.id))}
                          onChange={toggleAllLineItems}
                          className="accent-[var(--primary)]"
                        />
                      </th>
                      {/* Indicator column for acknowledgements and credits */}
                      {(visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) && (
                        <th className="px-1 py-2">
                          <div className="flex items-center gap-1">
                            {visibleColumns.has('iconAcknowledgement') && <div className="w-7"></div>}
                            {visibleColumns.has('iconDocumentSpecific') && <div className="w-7"></div>}
                            {visibleColumns.has('iconWarehouse') && <div className="w-7"></div>}
                            {visibleColumns.has('iconCredit') && <div className="w-7"></div>}
                          </div>
                        </th>
                      )}
                      {/* Dynamic columns */}
                      {visibleColumns.has('partNumber') && (
                        <th
                          className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                          style={getPinnedColumnStyle('partNumber')}
                        >
                          <div className="flex items-center gap-1">
                            Part #
                            {isPinned('partNumber') && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('custPartNumber') && (
                        <th
                          className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                          style={getPinnedColumnStyle('custPartNumber')}
                        >
                          <div className="flex items-center gap-1">
                            Cust Part #
                            {isPinned('custPartNumber') && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('description') && (
                        <th
                          className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                          style={getPinnedColumnStyle('description')}
                        >
                          <div className="flex items-center gap-1">
                            Description
                            {isPinned('description') && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('uom') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          UOM
                        </th>
                      )}
                      {visibleColumns.has('divisor') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Divisor
                        </th>
                      )}
                      {visibleColumns.has('unitPrice') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Unit Price
                        </th>
                      )}
                      {visibleColumns.has('quantity') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Qty
                        </th>
                      )}
                      {visibleColumns.has('shippedQty') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Shipped Qty
                        </th>
                      )}
                      {visibleColumns.has('lineStatus') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Status
                        </th>
                      )}
                      {visibleColumns.has('sellTotal') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Sell Total
                        </th>
                      )}
                      {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Commission %
                        </th>
                      )}
                      {visibleColumns.has('commission') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Commission
                        </th>
                      )}
                      {visibleColumns.has('commissionTotal') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Commission Total
                        </th>
                      )}
                      {visibleColumns.has('linkedQuote') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px]">
                          Quote #
                        </th>
                      )}
                      {visibleColumns.has('linkedInvoice') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px]">
                          Invoice #
                        </th>
                      )}
                      {visibleColumns.has('linkedCheck') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px]">
                          Check #
                        </th>
                      )}
                      {visibleColumns.has('linkedFulfillment') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px]">
                          Fulfillment #
                        </th>
                      )}
                      {visibleColumns.has('invoiced') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Invoiced
                        </th>
                      )}
                      {visibleColumns.has('percentOver') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          % Over
                        </th>
                      )}
                      {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Com %
                        </th>
                      )}
                      {visibleColumns.has('commissionAmount') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Com $
                        </th>
                      )}
                      {visibleColumns.has('ovgPercent') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Ovg %
                        </th>
                      )}
                      {visibleColumns.has('ovgAmount') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Ovg $
                        </th>
                      )}
                      {visibleColumns.has('earnPercent') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Earn %
                        </th>
                      )}
                      {visibleColumns.has('earnAmount') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Earn $
                        </th>
                      )}
                      {/* Actions column */}
                      <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.map(item => (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                          selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                        } ${item.isCredit ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedLineItems.has(item.id)}
                            onChange={() => toggleLineItemSelection(item.id)}
                            className="accent-[var(--primary)]"
                          />
                        </td>
                        {/* Indicator cell for acknowledgements and credits - conditional based on column visibility */}
                        {(visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) && (
                        <td className="px-1 py-2">
                          <div className="flex items-center gap-1">
                            {/* Acknowledgement indicator column */}
                            {visibleColumns.has('iconAcknowledgement') && (
                            <div className="w-7 flex justify-center">
                              {lineItemAcknowledgements[item.id] && (() => {
                                const ack = lineItemAcknowledgements[item.id];
                                const isPartial = ack.acknowledgedQty < item.quantity;
                                return (
                                  <div className="relative group">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center cursor-help ${isPartial ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                      {isPartial ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                                          <path d="M9 12l2 2 4-4"/>
                                          <rect x="3" y="4" width="18" height="16" rx="2"/>
                                          <path d="M3 12h4" strokeLinecap="round"/>
                                        </svg>
                                      ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                          <path d="M9 12l2 2 4-4"/>
                                          <rect x="3" y="4" width="18" height="16" rx="2"/>
                                        </svg>
                                      )}
                                    </div>
                                    <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                                      <div className={`font-semibold mb-2 text-base ${isPartial ? 'text-yellow-400' : 'text-blue-400'}`}>
                                        {isPartial ? 'Partial Acknowledgement' : 'Fully Acknowledged'}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between gap-4">
                                          <span className="text-gray-400">Ship Date:</span>
                                          <span className="font-medium">{ack.shipDate}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span className="text-gray-400">Ack #:</span>
                                          <span className="font-medium">{ack.ackNumber}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span className="text-gray-400">Acknowledged:</span>
                                          <span className="font-medium">{ack.acknowledgedQty} of {item.quantity}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                            )}
                            {/* Document-specific indicator column */}
                            {visibleColumns.has('iconDocumentSpecific') && (
                            <div className="w-7 flex justify-center">
                              {item.isDocumentSpecific && (
                                <div className="relative group">
                                  <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center cursor-help">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                                    <div className="font-semibold mb-1 text-purple-400">Document-Specific Product</div>
                                    <p className="text-xs text-gray-400">Created specifically for this order</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}
                            {/* Warehouse indicator column */}
                            {visibleColumns.has('iconWarehouse') && (
                            <div className="w-7 flex justify-center">
                              {item.isWarehouseConsignment && (
                                <div className="relative group">
                                  <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center cursor-help">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                                      <path d="M3 21h18v-9l-9-7-9 7v9z"/>
                                      <path d="M9 21v-6h6v6" fill="rgb(20 184 166)"/>
                                    </svg>
                                  </div>
                                  <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                                    <div className="font-semibold mb-2 text-teal-400">Warehouse Product</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">Inventory on Hand:</span>
                                        <span className="font-medium">{item.inventoryOnHand ?? 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}
                            {/* Credit indicator column */}
                            {visibleColumns.has('iconCredit') && (
                            <div className="w-7 flex justify-center">
                              {lineItemCredits[item.id] && (() => {
                                const credit = lineItemCredits[item.id];
                                return (
                                  <div className="relative group">
                                    <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center cursor-help">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 12h8"/>
                                      </svg>
                                    </div>
                                    <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                                      <div className="font-semibold mb-2 text-base text-red-400">Credit Applied</div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between gap-4">
                                          <span className="text-gray-400">Type:</span>
                                          <span className="font-medium">{credit.creditType}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span className="text-gray-400">Credit Qty:</span>
                                          <span className="font-medium text-red-400">-{credit.creditQty}</span>
                                        </div>
                                      </div>
                                      <div className="border-t border-gray-700 mt-2 pt-2">
                                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Original Values</div>
                                        <div className="space-y-1">
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">Qty:</span>
                                            <span className="font-medium">{credit.originalQty}</span>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">Total:</span>
                                            <span className="font-medium">{formatCurrency(credit.originalTotal)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                            )}
                          </div>
                        </td>
                        )}
                        {visibleColumns.has('partNumber') && (
                          <td
                            className={`px-3 py-2 text-sm ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                            style={getPinnedColumnStyle('partNumber')}
                          >
                            {item.isCredit ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M8 12h8"/>
                                </svg>
                                {item.creditType === 'return' ? 'RETURN' :
                                 item.creditType === 'short_ship' ? 'SHORT SHIP' :
                                 item.creditType === 'cancel' ? 'CANCEL' :
                                 item.creditType === 'damage' ? 'DAMAGE' : 'CREDIT'}
                              </span>
                            ) : (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.partNumber || ''}
                                  className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded"
                                  readOnly
                                />
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </td>
                        )}
                        {visibleColumns.has('custPartNumber') && (
                          <td
                            className={`px-3 py-2 text-sm ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                            style={getPinnedColumnStyle('custPartNumber')}
                          >
                            <div className="relative">
                              <select className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded appearance-none cursor-pointer">
                                <option value="">Select...</option>
                              </select>
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('description') && (
                          <td
                            className={`px-3 py-2 text-sm min-w-[300px] max-w-[400px] ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                            style={getPinnedColumnStyle('description')}
                          >
                            <div className="relative">
                              <input
                                type="text"
                                value={item.description}
                                className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded truncate"
                                readOnly
                                title={item.description}
                              />
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('uom') && (
                          <td className="px-3 py-2 text-sm text-center">EA</td>
                        )}
                        {visibleColumns.has('divisor') && (
                          <td className="px-3 py-2 text-sm text-center">1</td>
                        )}
                        {visibleColumns.has('unitPrice') && (
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                        )}
                        {visibleColumns.has('quantity') && (
                          <td className={`px-3 py-2 text-sm text-center ${item.isCredit ? 'text-red-600 font-medium' : ''}`}>{item.quantity}</td>
                        )}
                        {visibleColumns.has('shippedQty') && (
                          <td className="px-3 py-2 text-sm text-center">
                            {item.partNumber === 'FREIGHT' ? '' : item.quantityShipped}
                          </td>
                        )}
                        {visibleColumns.has('lineStatus') && (
                          <td className="px-3 py-2 text-sm text-center">
                            {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
                              const linkedInvoices = getLinkedInvoicesForLineItem(item, order!.id, mockInvoices);
                              const status = getLineShipStatus(item, linkedInvoices);
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.has('sellTotal') && (
                          <td className={`px-3 py-2 text-sm text-right font-medium ${item.isCredit ? 'text-red-600' : ''}`}>{formatCurrency(item.extendedPrice)}</td>
                        )}
                        {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">
                            {item.partNumber === 'FREIGHT' ? '' : `${((item.commissionRate || 0.08) * 100).toFixed(0)}%`}
                          </td>
                        )}
                        {visibleColumns.has('commission') && (
                          <td className={`px-3 py-2 text-sm text-right ${item.isCredit ? 'text-red-600' : 'text-purple-600'}`}>
                            {item.partNumber === 'FREIGHT' && !item.isCredit ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
                          </td>
                        )}
                        {visibleColumns.has('commissionTotal') && (
                          <td className={`px-3 py-2 text-sm text-right font-medium ${item.isCredit ? 'text-red-600' : 'text-purple-600'}`}>
                            {item.partNumber === 'FREIGHT' && !item.isCredit ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
                          </td>
                        )}
                        {visibleColumns.has('linkedQuote') && (
                          <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                            {item.partNumber !== 'FREIGHT' && !item.isCredit && order?.quoteId ? (
                              <button
                                onClick={() => router.push(`/quotes/${order.quoteId}`)}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
                              >
                                {order.quoteNumber}
                              </button>
                            ) : (
                              <span className="text-[var(--muted-foreground)]">-</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has('linkedInvoice') && (
                          <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                            {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
                              const linkedInvoices = getLinkedInvoicesForLineItem(item, order!.id, mockInvoices);
                              if (linkedInvoices.length === 0) {
                                return <span className="text-[var(--muted-foreground)]">-</span>;
                              }
                              return (
                                <button
                                  onClick={() => router.push(`/invoices/${linkedInvoices[0].id}`)}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setInvoiceTooltip({
                                      visible: true,
                                      x: rect.left,
                                      y: rect.top,
                                      invoices: linkedInvoices,
                                    });
                                  }}
                                  onMouseLeave={() => setInvoiceTooltip(prev => ({ ...prev, visible: false }))}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
                                >
                                  {linkedInvoices[0].invoiceNumber}
                                  {linkedInvoices.length > 1 && (
                                    <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                                      +{linkedInvoices.length - 1}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.has('linkedCheck') && (
                          <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                            {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
                              const linkedInvoices = getLinkedInvoicesForLineItem(item, order!.id, mockInvoices);
                              // Get all checks linked to any of the invoices
                              const linkedChecks = linkedInvoices.flatMap(inv =>
                                getLinkedChecksForInvoice(inv.id, mockChecks)
                              );
                              // Remove duplicates
                              const uniqueChecks = linkedChecks.filter((check, index, self) =>
                                index === self.findIndex(c => c.id === check.id)
                              );
                              if (uniqueChecks.length === 0) {
                                return <span className="text-[var(--muted-foreground)]">-</span>;
                              }
                              return (
                                <button
                                  onClick={() => router.push(`/commissions/${uniqueChecks[0].id}`)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
                                >
                                  {uniqueChecks[0].checkNumber}
                                  {uniqueChecks.length > 1 && (
                                    <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                                      +{uniqueChecks.length - 1}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.has('linkedFulfillment') && (
                          <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                            {item.fulfillmentRequestNumber ? (
                              <div className="relative group">
                                <button
                                  className="text-orange-600 hover:text-orange-800 hover:underline cursor-pointer whitespace-nowrap"
                                >
                                  {item.fulfillmentRequestNumber}
                                </button>
                                {/* Hover tooltip showing fulfillment status */}
                                <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                                  <div className="font-semibold mb-2 text-orange-400">Fulfillment Request</div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-gray-400">Request #:</span>
                                      <span className="font-medium">{item.fulfillmentRequestNumber}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-gray-400">Status:</span>
                                      <span className={`font-medium capitalize ${
                                        item.fulfillmentRequestStatus === 'pending' ? 'text-yellow-400' :
                                        item.fulfillmentRequestStatus === 'processing' ? 'text-blue-400' :
                                        item.fulfillmentRequestStatus === 'shipped' ? 'text-purple-400' :
                                        item.fulfillmentRequestStatus === 'delivered' ? 'text-green-400' :
                                        item.fulfillmentRequestStatus === 'cancelled' ? 'text-red-400' : ''
                                      }`}>
                                        {item.fulfillmentRequestStatus || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-gray-400">Quantity:</span>
                                      <span className="font-medium">{item.quantity}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--muted-foreground)]">-</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has('invoiced') && (
                          <td className="px-3 py-2 text-sm text-center">{item.quantityInvoiced}</td>
                        )}
                        {visibleColumns.has('percentOver') && (
                          <td className="px-3 py-2 text-sm text-right">
                            {item.partNumber === 'FREIGHT' ? '' : '15.0%'}
                          </td>
                        )}
                        {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">
                            {item.partNumber === 'FREIGHT' ? '' : `${((item.commissionRate || 0.08) * 100).toFixed(0)}%`}
                          </td>
                        )}
                        {visibleColumns.has('commissionAmount') && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">
                            {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
                          </td>
                        )}
                        {visibleColumns.has('ovgPercent') && (
                          <td className="px-3 py-2 text-sm text-right text-orange-500">
                            {item.partNumber === 'FREIGHT' ? '' : '85%'}
                          </td>
                        )}
                        {visibleColumns.has('ovgAmount') && (
                          <td className="px-3 py-2 text-sm text-right text-orange-500">
                            {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.unitPrice * 0.15 * item.quantity * 0.85)}
                          </td>
                        )}
                        {visibleColumns.has('earnPercent') && (
                          <td className="px-3 py-2 text-sm text-right text-green-600">
                            {item.partNumber === 'FREIGHT' ? '' : '20.8%'}
                          </td>
                        )}
                        {visibleColumns.has('earnAmount') && (
                          <td className="px-3 py-2 text-sm text-right text-green-600 font-medium">
                            {item.partNumber === 'FREIGHT' ? '' : formatCurrency((item.extendedPrice * (item.commissionRate || 0.08)) + (item.unitPrice * 0.15 * item.quantity * 0.85))}
                          </td>
                        )}
                        <td className="px-2 py-2">
                          <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="5" r="1"/>
                              <circle cx="10" cy="10" r="1"/>
                              <circle cx="10" cy="15" r="1"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Line Button */}
                <div className="border-t border-[var(--border)]">
                  <button className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Line
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Notes</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Internal notes for this order</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      SC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 20, 2024 at 2:34 PM</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">
                        Customer asked for 5% discount on corridor fixtures. Applied 4% - need manager approval for more.
                      </p>
                    </div>
                    <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                        <circle cx="10" cy="4" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="16" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      MT
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Mike Torres</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 4:15 PM</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">
                        Spoke with Turner Construction - they prefer Lutron but are open to alternatives if pricing is better. Deadline for approval response is end of month.
                      </p>
                    </div>
                    <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                        <circle cx="10" cy="4" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="16" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      SC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 10, 2024 at 9:15 AM</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">
                        Customer has expressed interest in upgrading to premium fixtures. May need to adjust lead times based on manufacturer availability. Follow up with Turner Construction regarding approval timeline.
                      </p>
                    </div>
                    <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                        <circle cx="10" cy="4" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="16" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this order</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Task
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {/* Overdue Task */}
                <div className="bg-[var(--card)] border-l-4 border-l-red-500 border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[var(--border)]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Follow up with Turner Construction</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Confirm approval timeline for Lutron fixtures
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                        <span>Due: Mar 25, 2024</span>
                        <span>Assigned: Sarah Chen</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Due Soon Task */}
                <div className="bg-[var(--card)] border-l-4 border-l-yellow-500 border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[var(--border)]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Send revised pricing to customer</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Due Soon</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Include updated overage calculations
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                        <span>Due: Mar 28, 2024</span>
                        <span>Assigned: Mike Torres</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Task */}
                <div className="bg-[var(--card)] border-l-4 border-l-green-500 border border-[var(--border)] rounded-lg p-4 opacity-75">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]" readOnly />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)] line-through">Submit approval request to Philips</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 line-through">
                        Request approval for LED panels
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Activity Feed</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">All activity and changes on this order</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]">
                  <option>All Activity</option>
                  <option>Price Updates</option>
                  <option>Approvals</option>
                  <option>Status Changes</option>
                </select>
              </div>

              {/* Activity List */}
              <div className="space-y-3">
                {/* Price Update */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                        <path d="M10 4v12M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">PRICE UPDATE</span>
                        <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Sarah Chen updated pricing</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Changed overage from 10% to 12.8% on LED Troffer items</p>
                    </div>
                  </div>
                </div>

                {/* Approval Update */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                        <circle cx="10" cy="10" r="8"/>
                        <path d="M10 6v4l2 2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">APPROVAL UPDATE</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Yesterday at 4:30 PM</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Lutron approval status changed</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Status changed to "Conditional" - specific products only approved</p>
                    </div>
                  </div>
                </div>

                {/* Approval Sent */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M4 4h12v12H4z" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 8h12M8 4v12" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">APPROVAL SENT</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 2:15 PM</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Mike Torres sent approval request</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Sent to Lutron via email at approvals@lutron.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'linked-objects' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Linked Objects</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Related entities connected to this order</p>
              </div>

              {/* Quotes Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                      <path d="M8 6h4M8 10h4M8 14h2"/>
                    </svg>
                    <span className="font-medium">Quotes</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">2</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Quote</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">QT-2024-001</span>
                      <span className="text-sm">Downtown Office Complex</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$125,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">active</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">QT-2024-003</span>
                      <span className="text-sm">Residential Tower Project</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$85,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                      <path d="M8 10h4M8 14h4"/>
                    </svg>
                    <span className="font-medium">Invoices</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">2</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Invoice</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">INV-2024-0892</span>
                      <span className="text-sm">Downtown Office - Deposit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$25,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">paid</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">INV-2024-0923</span>
                      <span className="text-sm">Downtown Office - Progress 1</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$35,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Statements Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                      <path d="M10 4v12M6 8l4-4 4 4"/>
                    </svg>
                    <span className="font-medium">Commission Statements</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">1</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Statement</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">CS-2024-03</span>
                      <span className="text-sm">March 2024 Statement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-600">$4,250</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">processed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M16 14v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/>
                      <circle cx="10" cy="7" r="3"/>
                    </svg>
                    <span className="font-medium">Contacts</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">3</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Contact</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">JS</div>
                      <div>
                        <div className="text-sm font-medium">John Smith</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Project Manager</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Turner Construction</div>
                      <div className="text-xs text-[var(--muted-foreground)]">jsmith@turner.com</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">ED</div>
                      <div>
                        <div className="text-sm font-medium">Emily Davis</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Purchasing Agent</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Turner Construction</div>
                      <div className="text-xs text-[var(--muted-foreground)]">edavis@turner.com</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">MC</div>
                      <div>
                        <div className="text-sm font-medium">Michael Chen</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Electrical Engineer</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">MEP Associates</div>
                      <div className="text-xs text-[var(--muted-foreground)]">mchen@mep.com</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Companies Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    </svg>
                    <span className="font-medium">Companies</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">2</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Company</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-medium">TU</div>
                      <div>
                        <div className="text-sm font-medium">Turner Construction</div>
                        <div className="text-xs text-[var(--muted-foreground)]">New York, NY</div>
                      </div>
                    </div>
                    <span className="text-sm text-[var(--primary)]">Customer</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">ME</div>
                      <div>
                        <div className="text-sm font-medium">MEP Associates</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Chicago, IL</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Consultant</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-4">
              {/* Credits Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Credit #</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Part Number</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Reason</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Qty</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Credit Amount</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Comm. %</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Comm. Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {/* Mock credit data */}
                    <tr className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">CR-001234</td>
                      <td className="px-4 py-3">12/10/2024</td>
                      <td className="px-4 py-3">LBL4-LP840</td>
                      <td className="px-4 py-3">Defective unit</td>
                      <td className="px-4 py-3 text-right">2</td>
                      <td className="px-4 py-3 text-right text-red-600">-$570.00</td>
                      <td className="px-4 py-3 text-right">0.75%</td>
                      <td className="px-4 py-3 text-right text-red-600">-$4.28</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Posted</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">CR-001235</td>
                      <td className="px-4 py-3">12/12/2024</td>
                      <td className="px-4 py-3">LBL4-LP840</td>
                      <td className="px-4 py-3">Price adjustment</td>
                      <td className="px-4 py-3 text-right">5</td>
                      <td className="px-4 py-3 text-right text-red-600">-$142.50</td>
                      <td className="px-4 py-3 text-right">0.75%</td>
                      <td className="px-4 py-3 text-right text-red-600">-$1.07</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold">Totals:</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">-$712.50</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">-$5.35</td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Add Credit Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setCreditLineItems([]);
                    setCreditName('');
                    setCreditNote('');
                    setShowLineCreditModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Credit
                </button>
              </div>
            </div>
          )}

          {activeTab === 'acknowledgements' && (
            <div className="space-y-4">
              {/* Acknowledgements Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack #</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Part Number</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Description</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ordered Qty</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack Qty</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Remaining</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ship Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {/* Mock acknowledgement data */}
                    <tr className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78901</td>
                      <td className="px-4 py-3">12/05/2024</td>
                      <td className="px-4 py-3">LBL4-LP840</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">4ft LED Low Bay, 4000K</td>
                      <td className="px-4 py-3 text-right">100</td>
                      <td className="px-4 py-3 text-right">50</td>
                      <td className="px-4 py-3 text-right text-amber-600">50</td>
                      <td className="px-4 py-3">12/15/2024</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partial</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78902</td>
                      <td className="px-4 py-3">12/08/2024</td>
                      <td className="px-4 py-3">LBL4-LP840</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">4ft LED Low Bay, 4000K</td>
                      <td className="px-4 py-3 text-right">100</td>
                      <td className="px-4 py-3 text-right">50</td>
                      <td className="px-4 py-3 text-right text-green-600">0</td>
                      <td className="px-4 py-3">12/20/2024</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78903</td>
                      <td className="px-4 py-3">12/10/2024</td>
                      <td className="px-4 py-3">WHL-2X4-35</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">2x4 LED Panel, 3500K</td>
                      <td className="px-4 py-3 text-right">25</td>
                      <td className="px-4 py-3 text-right">25</td>
                      <td className="px-4 py-3 text-right text-green-600">0</td>
                      <td className="px-4 py-3">12/18/2024</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold">Totals:</td>
                      <td className="px-4 py-3 text-right font-semibold">125</td>
                      <td className="px-4 py-3 text-right font-semibold">125</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">50</td>
                      <td colSpan={2} className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Add Acknowledgement Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const items = order.lineItems.filter(li => !li.isCredit).map(li => ({
                      lineId: li.id,
                      partNumber: li.partNumber || '',
                      orderedQty: li.quantity,
                      acknowledgedQty: li.quantity,
                      shipDate: ''
                    }));
                    setAckLineItems(items);
                    setAckNumber('');
                    setAckDate('');
                    setShowLineAcknowledgementModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Acknowledgement
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <div className="space-y-5">
                {/* End User Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEndUserPerLine(!showEndUserPerLine)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      showEndUserPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                        showEndUserPerLine ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-[var(--foreground)]">Specify end user per line item</span>
                </div>

                {/* Outside Rep Commission Splits Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowOutsideRepPerLine(!showOutsideRepPerLine)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      showOutsideRepPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                        showOutsideRepPerLine ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--foreground)]">Outside rep at line item level</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{showOutsideRepPerLine ? 'Set outside rep per line item' : 'Set outside rep in header'}</span>
                  </div>
                </div>

                {/* Inside Rep Commission Splits Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowInsideRepPerLine(!showInsideRepPerLine)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      showInsideRepPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                        showInsideRepPerLine ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--foreground)]">Inside rep at line item level</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{showInsideRepPerLine ? 'Set inside rep per line item' : 'Set inside rep in header'}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]"></div>

                {/* Customer Part Number Source Toggle */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Customer Part Number Source</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerPartNumberSource"
                        checked={customerPartNumberSource === 'soldTo'}
                        onChange={() => setCustomerPartNumberSource('soldTo')}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">Sold To Customer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerPartNumberSource"
                        checked={customerPartNumberSource === 'endUser'}
                        onChange={() => setCustomerPartNumberSource('endUser')}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">End User</span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]"></div>

                {/* Freight Line Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!order) return;

                      if (!hasFreightLine) {
                        // Add freight line item
                        const freightLineItem: OrderLineItem = {
                          id: `freight-${Date.now()}`,
                          lineNumber: order.lineItems.length + 1,
                          productId: 'FREIGHT',
                          partNumber: 'FREIGHT',
                          description: 'Freight',
                          quantity: 1,
                          unitPrice: 0,
                          extendedPrice: 0,
                          commissionRate: 0,
                          commissionAmount: 0,
                          quantityShipped: 0,
                          quantityInvoiced: 0,
                          quantityCredited: 0,
                          isCancelled: false,
                          isConsignment: false,
                        };

                        const updatedOrder = {
                          ...order,
                          lineItems: [...order.lineItems, freightLineItem],
                        };

                        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
                      } else {
                        // Remove freight line item
                        const updatedOrder = {
                          ...order,
                          lineItems: order.lineItems.filter(item => item.partNumber !== 'FREIGHT'),
                        };

                        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      hasFreightLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                        hasFreightLine ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--foreground)]">Freight line</span>
                    <span className="text-xs text-[var(--muted-foreground)]">Add a freight line item to this order</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outside Rep Commission Splits Modal */}
      {showOutsideRepSplitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Outside Rep Commission Splits</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Divide commission among outside reps</p>
              </div>
              <button
                onClick={() => setShowOutsideRepSplitsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const totalPercentage = outsideRepSplits.reduce((sum, split) => sum + split.percentage, 0);
                const isValid = totalPercentage === 100;
                return (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                      Total: {totalPercentage}%
                    </span>
                    {!isValid && <span className="text-xs text-yellow-600">Must equal 100%</span>}
                    {isValid && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-3">
                {outsideRepSplits.map((split, index) => (
                  <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                    <div className="flex-1">
                      <select
                        value={split.repId}
                        onChange={(e) => {
                          const newRep = availableOutsideReps.find(r => r.id === e.target.value);
                          if (newRep) {
                            setOutsideRepSplits(prev => prev.map((s, i) =>
                              i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
                            ));
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      >
                        {availableOutsideReps.map(rep => (
                          <option key={rep.id} value={rep.id} disabled={outsideRepSplits.some(s => s.repId === rep.id && s.repId !== split.repId)}>
                            {rep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={split.percentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0));
                          const otherRepsCount = outsideRepSplits.length - 1;
                          if (otherRepsCount > 0) {
                            const remaining = 100 - value;
                            const perRep = Math.floor(remaining / otherRepsCount);
                            const remainder = remaining - (perRep * otherRepsCount);
                            let extraAssigned = 0;
                            setOutsideRepSplits(prev => prev.map((s, i) => {
                              if (i === index) return { ...s, percentage: value };
                              const extraPercent = extraAssigned < remainder ? 1 : 0;
                              extraAssigned++;
                              return { ...s, percentage: Math.max(0, perRep + extraPercent) };
                            }));
                          } else {
                            setOutsideRepSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                    {outsideRepSplits.length > 1 && (
                      <button
                        onClick={() => {
                          const remaining = outsideRepSplits.filter((_, i) => i !== index);
                          const newCount = remaining.length;
                          const perRep = Math.floor(100 / newCount);
                          const remainder = 100 - (perRep * newCount);
                          let extraAssigned = 0;
                          setOutsideRepSplits(remaining.map(s => {
                            const extraPercent = extraAssigned < remainder ? 1 : 0;
                            extraAssigned++;
                            return { ...s, percentage: perRep + extraPercent };
                          }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {outsideRepSplits.length < availableOutsideReps.length && (
                <button
                  onClick={() => {
                    const usedRepIds = new Set(outsideRepSplits.map(s => s.repId));
                    const availableRep = availableOutsideReps.find(r => !usedRepIds.has(r.id));
                    if (availableRep) {
                      const newCount = outsideRepSplits.length + 1;
                      const perRep = Math.floor(100 / newCount);
                      const remainder = 100 - (perRep * newCount);
                      let extraAssigned = 0;
                      const updatedSplits = outsideRepSplits.map(s => {
                        const extraPercent = extraAssigned < remainder ? 1 : 0;
                        extraAssigned++;
                        return { ...s, percentage: perRep + extraPercent };
                      });
                      const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
                      setOutsideRepSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Rep
                </button>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setSplitOutsideCommission(false); setOutsideRepSplits([]); setShowOutsideRepSplitsModal(false); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOutsideRepSplitsModal(false)}
                disabled={outsideRepSplits.reduce((sum, s) => sum + s.percentage, 0) !== 100}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inside Rep Commission Splits Modal */}
      {showInsideRepSplitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Inside Rep Commission Splits</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Divide commission among inside reps</p>
              </div>
              <button
                onClick={() => setShowInsideRepSplitsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const totalPercentage = insideRepSplits.reduce((sum, split) => sum + split.percentage, 0);
                const isValid = totalPercentage === 100;
                return (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                      Total: {totalPercentage}%
                    </span>
                    {!isValid && <span className="text-xs text-yellow-600">Must equal 100%</span>}
                    {isValid && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-3">
                {insideRepSplits.map((split, index) => (
                  <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                    <div className="flex-1">
                      <select
                        value={split.repId}
                        onChange={(e) => {
                          const newRep = availableInsideReps.find(r => r.id === e.target.value);
                          if (newRep) {
                            setInsideRepSplits(prev => prev.map((s, i) =>
                              i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
                            ));
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      >
                        {availableInsideReps.map(rep => (
                          <option key={rep.id} value={rep.id} disabled={insideRepSplits.some(s => s.repId === rep.id && s.repId !== split.repId)}>
                            {rep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={split.percentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0));
                          const otherRepsCount = insideRepSplits.length - 1;
                          if (otherRepsCount > 0) {
                            const remaining = 100 - value;
                            const perRep = Math.floor(remaining / otherRepsCount);
                            const remainder = remaining - (perRep * otherRepsCount);
                            let extraAssigned = 0;
                            setInsideRepSplits(prev => prev.map((s, i) => {
                              if (i === index) return { ...s, percentage: value };
                              const extraPercent = extraAssigned < remainder ? 1 : 0;
                              extraAssigned++;
                              return { ...s, percentage: Math.max(0, perRep + extraPercent) };
                            }));
                          } else {
                            setInsideRepSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                    {insideRepSplits.length > 1 && (
                      <button
                        onClick={() => {
                          const remaining = insideRepSplits.filter((_, i) => i !== index);
                          const newCount = remaining.length;
                          const perRep = Math.floor(100 / newCount);
                          const remainder = 100 - (perRep * newCount);
                          let extraAssigned = 0;
                          setInsideRepSplits(remaining.map(s => {
                            const extraPercent = extraAssigned < remainder ? 1 : 0;
                            extraAssigned++;
                            return { ...s, percentage: perRep + extraPercent };
                          }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {insideRepSplits.length < availableInsideReps.length && (
                <button
                  onClick={() => {
                    const usedRepIds = new Set(insideRepSplits.map(s => s.repId));
                    const availableRep = availableInsideReps.find(r => !usedRepIds.has(r.id));
                    if (availableRep) {
                      const newCount = insideRepSplits.length + 1;
                      const perRep = Math.floor(100 / newCount);
                      const remainder = 100 - (perRep * newCount);
                      let extraAssigned = 0;
                      const updatedSplits = insideRepSplits.map(s => {
                        const extraPercent = extraAssigned < remainder ? 1 : 0;
                        extraAssigned++;
                        return { ...s, percentage: perRep + extraPercent };
                      });
                      const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
                      setInsideRepSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Rep
                </button>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setSplitInsideCommission(false); setInsideRepSplits([]); setShowInsideRepSplitsModal(false); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInsideRepSplitsModal(false)}
                disabled={insideRepSplits.reduce((sum, s) => sum + s.percentage, 0) !== 100}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections Settings Modal */}
      {showSectionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Section Settings</h2>
              <button
                onClick={() => setShowSectionsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Enable Sections Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--foreground)]">Enable Sections</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Group line items by section</div>
                </div>
                <button
                  onClick={() => setShowSections(!showSections)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSections ? 'bg-[var(--primary)]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    showSections ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Display Mode - only show when sections are enabled */}
              {showSections && (
                <div className="space-y-3">
                  <div className="font-medium text-[var(--foreground)]">Display Mode</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors">
                      <input
                        type="radio"
                        name="sectionDisplayMode"
                        checked={sectionDisplayMode === 'column'}
                        onChange={() => setSectionDisplayMode('column')}
                        className="accent-[var(--primary)]"
                      />
                      <div>
                        <div className="font-medium text-[var(--foreground)]">Column Mode</div>
                        <div className="text-sm text-[var(--muted-foreground)]">Show section as a column in the table</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors">
                      <input
                        type="radio"
                        name="sectionDisplayMode"
                        checked={sectionDisplayMode === 'lineShelf'}
                        onChange={() => setSectionDisplayMode('lineShelf')}
                        className="accent-[var(--primary)]"
                      />
                      <div>
                        <div className="font-medium text-[var(--foreground)]">Line Shelf Mode</div>
                        <div className="text-sm text-[var(--muted-foreground)]">Show section headers as row dividers</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setShowSectionsModal(false)}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns Configuration Modal */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Configure Columns</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Toggle visibility and pin columns to freeze them</p>
              </div>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-2 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="flex items-center gap-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                <div className="w-5"></div>
                <span className="flex-1">Column</span>
                <span className="w-16 text-center">Pin Left</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-1">
                {/* Pinned columns section */}
                {pinnedColumns.size > 0 && (
                  <>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Pinned Columns (Frozen Left)
                    </div>
                    {(Object.keys(columnLabels) as ColumnKey[]).filter(col => pinnedColumns.has(col)).map(colKey => (
                      <div
                        key={colKey}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-blue-50 border-blue-200"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(colKey)}
                          onChange={() => toggleColumn(colKey)}
                          className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                        />
                        <span className="flex-1 text-sm font-medium text-blue-700">
                          {columnLabels[colKey]}
                        </span>
                        <button
                          onClick={() => togglePinColumn(colKey)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600"
                          title="Unpin column"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] my-3"></div>
                    <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                      Other Columns
                    </div>
                  </>
                )}
                {/* Unpinned columns */}
                {(Object.keys(columnLabels) as ColumnKey[]).filter(col => !pinnedColumns.has(col)).map(colKey => (
                  <div
                    key={colKey}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(colKey)}
                      onChange={() => toggleColumn(colKey)}
                      className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                    />
                    <span className="flex-1 text-sm font-medium">
                      {columnLabels[colKey]}
                    </span>
                    <button
                      onClick={() => togglePinColumn(colKey)}
                      disabled={!visibleColumns.has(colKey)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        visibleColumns.has(colKey)
                          ? 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                          : 'opacity-30 cursor-not-allowed'
                      }`}
                      title="Pin column to left"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="text-sm text-[var(--muted-foreground)]">
                {pinnedColumns.size > 0 && (
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {pinnedColumns.size} column{pinnedColumns.size !== 1 ? 's' : ''} pinned
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Detail Line Lookup Modal */}
      {showQuoteLookupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Quote Detail Line Lookup</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Click the checkbox for each line you want to add to your order. The applicable detail lines will be inserted into your order and the corresponding quote detail line will be marked as ordered if currently set to Open.
                </p>
              </div>
              <button
                onClick={() => setShowQuoteLookupModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Part Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quoteLookupPartNumber}
                    onChange={(e) => setQuoteLookupPartNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Quote Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quoteLookupQuoteNumber}
                    onChange={(e) => setQuoteLookupQuoteNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Start Date<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={quoteLookupStartDate}
                      onChange={(e) => setQuoteLookupStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                    />
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    End Date<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={quoteLookupEndDate}
                      onChange={(e) => setQuoteLookupEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                    />
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quoteLookupOpenOnly}
                    onChange={(e) => setQuoteLookupOpenOnly(e.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    Include Only <span className="text-[var(--primary)] font-medium">Open Quotes</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quoteLookupBlanketOnly}
                    onChange={(e) => setQuoteLookupBlanketOnly(e.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    Include Only <span className="text-[var(--primary)] font-medium">Blanket Quotes</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowQuoteLookupModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Search and show results
                  alert('Searching for quote lines...');
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line Item Credit Modal */}
      {showLineCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Creating Credit <span className="text-red-600">({formatCurrency(creditLineItems.reduce((sum, li) => sum + li.creditAmount, 0))})</span>
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">Credits are applied as negative quantities against the order</p>
              </div>
              <button
                onClick={() => setShowLineCreditModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Credit Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={creditName}
                    onChange={(e) => setCreditName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                      !creditName ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {!creditName && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Credit Date<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={creditDate}
                      onChange={(e) => setCreditDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                    />
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                      <rect x="3" y="4" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M7 2v4M13 2v4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Note
                </label>
                <textarea
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  rows={2}
                  placeholder="Add any additional notes about this credit..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>

              {/* Credit Line Items */}
              <div>
                <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                  {creditLineItems.map((item, index) => {
                    const linkedLineItem = item.linkedLineItemId
                      ? order?.lineItems.find(li => li.id === item.linkedLineItemId)
                      : null;

                    return (
                      <div key={index} className="p-4 space-y-3">
                        {/* Row 1: Line Item Selection, Credit Type, Delete */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Line Item</label>
                            <select
                              value={item.linkedLineItemId || 'order-level'}
                              onChange={(e) => {
                                const newItems = [...creditLineItems];
                                const selectedValue = e.target.value;
                                if (selectedValue === 'order-level') {
                                  newItems[index].linkedLineItemId = null;
                                  newItems[index].partNumber = '';
                                  newItems[index].unitPrice = 0;
                                  newItems[index].quantity = 0;
                                  newItems[index].creditAmount = 0;
                                  newItems[index].commissionAmount = 0;
                                } else {
                                  const lineItem = order?.lineItems.find(li => li.id === selectedValue);
                                  if (lineItem) {
                                    newItems[index].linkedLineItemId = lineItem.id;
                                    newItems[index].partNumber = lineItem.partNumber || '';
                                    newItems[index].unitPrice = lineItem.unitPrice;
                                    newItems[index].quantity = 0; // Start at 0, user inputs credit qty
                                    newItems[index].creditAmount = 0;
                                    newItems[index].commissionPercent = (lineItem.commissionRate || 0.08) * 100;
                                    newItems[index].commissionAmount = 0;
                                  }
                                }
                                setCreditLineItems(newItems);
                              }}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                            >
                              <option value="order-level">Order-Level Credit (not tied to a line item)</option>
                              {order?.lineItems.filter(li => li.partNumber !== 'FREIGHT').map(li => (
                                <option key={li.id} value={li.id}>
                                  {li.partNumber} - {li.description?.substring(0, 40)}{li.description && li.description.length > 40 ? '...' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-40">
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Credit Type *</label>
                            <select
                              value={item.creditType}
                              onChange={(e) => {
                                const newItems = [...creditLineItems];
                                newItems[index].creditType = e.target.value as '' | 'return' | 'short_ship' | 'cancel' | 'damage';
                                setCreditLineItems(newItems);
                              }}
                              className={`w-full px-3 py-2 border rounded-lg text-sm bg-[var(--background)] ${
                                !item.creditType ? 'border-red-500' : 'border-[var(--border)]'
                              }`}
                            >
                              <option value="">Select Type</option>
                              <option value="return">Return</option>
                              <option value="short_ship">Short Ship</option>
                              <option value="cancel">Cancel</option>
                              <option value="damage">Damage</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              setCreditLineItems(creditLineItems.filter((_, i) => i !== index));
                            }}
                            className="mt-5 p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                          >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>

                        {/* Row 2: Show original line item info if linked */}
                        {linkedLineItem && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-xs font-medium text-blue-700 mb-2">Original Line Item</div>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <span className="text-[var(--muted-foreground)]">Qty Ordered:</span>
                                <span className="ml-1 font-medium">{linkedLineItem.quantity}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Unit Price:</span>
                                <span className="ml-1 font-medium">{formatCurrency(linkedLineItem.unitPrice)}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Line Total:</span>
                                <span className="ml-1 font-medium">{formatCurrency(linkedLineItem.extendedPrice)}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Shipped:</span>
                                <span className="ml-1 font-medium">{linkedLineItem.quantityShipped}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Invoiced:</span>
                                <span className="ml-1 font-medium">{linkedLineItem.quantityInvoiced}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Row 3: Credit Input Fields */}
                        <div className="grid grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                              Credit Qty *
                            </label>
                            <input
                              type="number"
                              value={item.quantity === 0 ? '' : Math.abs(item.quantity)}
                              min={1}
                              max={linkedLineItem?.quantity}
                              placeholder={linkedLineItem ? `Max: ${linkedLineItem.quantity}` : ''}
                              onChange={(e) => {
                                const newItems = [...creditLineItems];
                                const qty = parseInt(e.target.value) || 0;
                                // Store as negative
                                newItems[index].quantity = -Math.abs(qty);
                                newItems[index].creditAmount = newItems[index].quantity * newItems[index].unitPrice;
                                newItems[index].commissionAmount = newItems[index].creditAmount * (newItems[index].commissionPercent / 100);
                                setCreditLineItems(newItems);
                              }}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Unit Price</label>
                            <input
                              type="text"
                              value={formatCurrency(item.unitPrice)}
                              onChange={(e) => {
                                const newItems = [...creditLineItems];
                                newItems[index].unitPrice = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                                newItems[index].creditAmount = newItems[index].quantity * newItems[index].unitPrice;
                                newItems[index].commissionAmount = newItems[index].creditAmount * (newItems[index].commissionPercent / 100);
                                setCreditLineItems(newItems);
                              }}
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Credit Amount</label>
                            <div className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30 text-red-600 font-medium">
                              {formatCurrency(item.creditAmount)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Com %</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                value={item.commissionPercent}
                                onChange={(e) => {
                                  const newItems = [...creditLineItems];
                                  newItems[index].commissionPercent = parseFloat(e.target.value) || 0;
                                  newItems[index].commissionAmount = newItems[index].creditAmount * (newItems[index].commissionPercent / 100);
                                  setCreditLineItems(newItems);
                                }}
                                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                              />
                              <span className="text-sm text-[var(--muted-foreground)]">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Com Amount</label>
                            <div className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30 text-red-600">
                              {formatCurrency(item.commissionAmount)}
                            </div>
                          </div>
                        </div>

                        {/* Row 4: Impact Summary for linked line items */}
                        {linkedLineItem && item.quantity !== 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="text-xs font-medium text-orange-700 mb-2">Impact After Credit</div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-[var(--muted-foreground)]">New Qty:</span>
                                <span className="ml-1 font-medium">{linkedLineItem.quantity + item.quantity}</span>
                                <span className="ml-1 text-red-600">({item.quantity})</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">New Line Total:</span>
                                <span className="ml-1 font-medium">{formatCurrency(linkedLineItem.extendedPrice + item.creditAmount)}</span>
                                <span className="ml-1 text-red-600">({formatCurrency(item.creditAmount)})</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Commission Impact:</span>
                                <span className="ml-1 text-red-600 font-medium">{formatCurrency(item.commissionAmount)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {creditLineItems.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[var(--muted-foreground)] mb-3">No credit lines added.</p>
                      <button
                        onClick={() => {
                          setCreditLineItems([...creditLineItems, {
                            partNumber: '',
                            linkedLineItemId: null,
                            creditType: '',
                            quantity: 0,
                            unitPrice: 0,
                            creditAmount: 0,
                            commissionPercent: 8,
                            commissionAmount: 0,
                          }]);
                        }}
                        className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                        </svg>
                        Add Credit Line
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 px-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCreditLineItems([...creditLineItems, {
                          partNumber: '',
                          linkedLineItemId: null, // Order-level credit
                          creditType: '', // Required - user must select
                          quantity: 0, // User must input quantity
                          unitPrice: 0,
                          creditAmount: 0,
                          commissionPercent: 8,
                          commissionAmount: 0,
                        }]);
                      }}
                      className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Add Credit Line
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {creditLineItems.length > 0 && `${creditLineItems.length} line${creditLineItems.length !== 1 ? 's' : ''}`}
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      Total: {formatCurrency(creditLineItems.reduce((sum, li) => sum + li.creditAmount, 0))}
                    </span>
                  </div>
                </div>
              </div>

            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowLineCreditModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Validate all credit lines have a type and quantity
                  const hasInvalidType = creditLineItems.some(li => !li.creditType);
                  const hasInvalidQty = creditLineItems.some(li => li.quantity === 0);
                  if (hasInvalidType) {
                    alert('Please select a credit type for all lines');
                    return;
                  }
                  if (hasInvalidQty) {
                    alert('Please enter a credit quantity for all lines');
                    return;
                  }
                  if (!creditName) {
                    alert('Please enter a credit name');
                    return;
                  }
                  if (creditLineItems.length === 0) {
                    alert('Please add at least one credit line');
                    return;
                  }
                  alert('Credit created successfully');
                  setShowLineCreditModal(false);
                  setSelectedLineItems(new Set());
                }}
                disabled={!creditName || creditLineItems.length === 0 || creditLineItems.some(li => !li.creditType || li.quantity === 0)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  !creditName || creditLineItems.length === 0 || creditLineItems.some(li => !li.creditType || li.quantity === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                }`}
              >
                Save Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Overage % Modal */}
      {showSetOverageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Overage %</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Apply overage percentage to {selectedLineItems.size} selected line{selectedLineItems.size !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Overage Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={bulkOveragePercent}
                  onChange={(e) => setBulkOveragePercent(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="e.g., 10"
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setShowSetOverageModal(false); setBulkOveragePercent(''); }}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Overage set to ${bulkOveragePercent}% for selected items`);
                  setShowSetOverageModal(false);
                  setBulkOveragePercent('');
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set End User Modal */}
      {showSetEndUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Set End User</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Apply end user to {selectedLineItems.size} selected line{selectedLineItems.size !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                End User
              </label>
              <select
                value={bulkEndUser}
                onChange={(e) => setBulkEndUser(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="">Select End User...</option>
                <option value="customer1">Skanska USA</option>
                <option value="customer2">Turner Construction</option>
                <option value="customer3">McCarthy Building</option>
                <option value="customer4">Whiting-Turner</option>
              </select>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setShowSetEndUserModal(false); setBulkEndUser(''); }}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`End user set for selected items`);
                  setShowSetEndUserModal(false);
                  setBulkEndUser('');
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Outside Rep Splits Modal */}
      {showSetOutsideRepSplitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Outside Rep Splits</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Configure commission splits for {selectedLineItems.size} selected line{selectedLineItems.size !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Outside Rep
                </label>
                <select
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select Rep...</option>
                  <option value="rep1">John Smith</option>
                  <option value="rep2">Sarah Johnson</option>
                  <option value="rep3">Mike Williams</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Split Percentage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    placeholder="e.g., 50"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowSetOutsideRepSplitsModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Outside rep splits configured for selected items');
                  setShowSetOutsideRepSplitsModal(false);
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line Item Order Acknowledgement Modal */}
      {showLineAcknowledgementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-xl w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Add Acknowledgements for {order?.orderNumber}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  The below acknowledgment number and ship date will be applied to all selected detail lines.
                </p>
              </div>
              <button
                onClick={() => setShowLineAcknowledgementModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Acknowledgement Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ackNumber}
                  onChange={(e) => setAckNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  placeholder="Enter acknowledgement number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Order Ack. Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={ackDate}
                    onChange={(e) => setAckDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* Line Item Quantities */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Acknowledged Quantity per Line Item
                </label>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">
                  The acknowledged quantity may be less than the full ordered quantity for partial acknowledgements.
                </p>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-2 px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                    <div>Part Number</div>
                    <div>Ordered Qty</div>
                    <div>Ack. Qty</div>
                    <div>Ship Date</div>
                    <div></div>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {ackLineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-2 px-3 py-2 items-center">
                        <select
                          value={item.lineId}
                          onChange={(e) => {
                            const newItems = [...ackLineItems];
                            const selectedLineItem = order?.lineItems.find(li => li.id === e.target.value);
                            if (selectedLineItem) {
                              newItems[index].lineId = selectedLineItem.id;
                              newItems[index].partNumber = selectedLineItem.partNumber || '';
                              newItems[index].orderedQty = selectedLineItem.quantity;
                              newItems[index].acknowledgedQty = selectedLineItem.quantity;
                            }
                            setAckLineItems(newItems);
                          }}
                          className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                        >
                          <option value="">Select line item...</option>
                          {order?.lineItems.filter(li => li.partNumber !== 'FREIGHT').map(li => (
                            <option key={li.id} value={li.id}>
                              {li.partNumber}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-[var(--muted-foreground)]">{item.orderedQty}</span>
                        <input
                          type="number"
                          value={item.acknowledgedQty}
                          onChange={(e) => {
                            const newItems = [...ackLineItems];
                            const newQty = parseInt(e.target.value) || 0;
                            newItems[index].acknowledgedQty = Math.min(newQty, item.orderedQty);
                            setAckLineItems(newItems);
                          }}
                          max={item.orderedQty}
                          min={0}
                          className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                        />
                        <input
                          type="date"
                          value={item.shipDate}
                          onChange={(e) => {
                            const newItems = [...ackLineItems];
                            newItems[index].shipDate = e.target.value;
                            setAckLineItems(newItems);
                          }}
                          className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                        />
                        <button
                          onClick={() => {
                            setAckLineItems(ackLineItems.filter((_, i) => i !== index));
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors text-red-500"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    {ackLineItems.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">No lines added.</p>
                        <button
                          onClick={() => {
                            setAckLineItems([...ackLineItems, {
                              lineId: '',
                              partNumber: '',
                              orderedQty: 0,
                              acknowledgedQty: 0,
                              shipDate: '',
                            }]);
                          }}
                          className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                          </svg>
                          Add Line
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {ackLineItems.length > 0 && (
                  <button
                    onClick={() => {
                      setAckLineItems([...ackLineItems, {
                        lineId: '',
                        partNumber: '',
                        orderedQty: 0,
                        acknowledgedQty: 0,
                        shipDate: '',
                      }]);
                    }}
                    className="mt-2 flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                    </svg>
                    Add Line
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowLineAcknowledgementModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Acknowledgement added successfully');
                  setShowLineAcknowledgementModal(false);
                  setSelectedLineItems(new Set());
                }}
                disabled={!ackNumber || !ackDate}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Conversion Modal */}
      {showWarehouseConversionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                    <path d="M3 7h14l-1.5 9H4.5L3 7z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    {warehouseConversionMode === 'all' ? 'Convert Products to Warehouse' : 'Convert to Warehouse Products'}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {warehouseConversionMode === 'all'
                      ? 'Mark all products for warehouse fulfillment'
                      : `Convert ${productsToConvert.filter(p => !p.isAlreadyWarehouse).length} selected product(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowWarehouseConversionModal(false); setProductsToConvert([]); }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="text-2xl font-bold text-teal-700">
                    {productsToConvert.filter(p => !p.isAlreadyWarehouse).length}
                  </div>
                  <div className="text-sm text-teal-600">Products to Convert</div>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {productsToConvert.filter(p => p.isAlreadyWarehouse).length}
                  </div>
                  <div className="text-sm text-gray-600">Already Warehouse</div>
                </div>
              </div>

              {/* Products list */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Products</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {productsToConvert.map((product) => (
                    <div
                      key={product.id}
                      className={`px-4 py-2 flex items-center justify-between border-b border-[var(--border)] last:border-0 ${
                        product.isAlreadyWarehouse ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span className="text-sm font-medium">{product.partNumber}</span>
                      {product.isAlreadyWarehouse ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-700 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Already Warehouse
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                          Will Convert
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning message */}
              {productsToConvert.filter(p => !p.isAlreadyWarehouse).length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5">
                    <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                    <path d="M3 17h14l-7-12-7 12z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      These products will be marked as warehouse consignment
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      This will enable inventory tracking and warehouse fulfillment for these products.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setShowWarehouseConversionModal(false); setProductsToConvert([]); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmWarehouseConversion}
                disabled={productsToConvert.filter(p => !p.isAlreadyWarehouse).length === 0}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Convert to Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Request Modal */}
      {showFulfillmentRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12h8M8 16h5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Generate Fulfillment Request
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {fulfillmentRequestMode === 'all'
                      ? 'Create fulfillment request for all warehouse products'
                      : `Create fulfillment request for ${lineItemsForFulfillment.filter(p => !p.hasExistingRequest).length} selected product(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowFulfillmentRequestModal(false); setLineItemsForFulfillment([]); }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {lineItemsForFulfillment.filter(p => !p.hasExistingRequest).length}
                  </div>
                  <div className="text-sm text-orange-600">Items to Include</div>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {lineItemsForFulfillment.filter(p => p.hasExistingRequest).length}
                  </div>
                  <div className="text-sm text-gray-600">Already Have Requests</div>
                </div>
              </div>

              {/* Products list */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Warehouse Products</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {lineItemsForFulfillment.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-2 flex items-center justify-between border-b border-[var(--border)] last:border-0 ${
                        item.hasExistingRequest ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium">{item.partNumber}</span>
                        <span className="text-xs text-[var(--muted-foreground)] ml-2">Qty: {item.quantity}</span>
                      </div>
                      {item.hasExistingRequest ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Has Request
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                          Will Include
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info message */}
              {lineItemsForFulfillment.filter(p => !p.hasExistingRequest).length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 7v3M10 13h.01" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      A fulfillment request will be generated
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      The request will be sent to the warehouse for processing. You can track the status in the Fulfillment # column.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setShowFulfillmentRequestModal(false); setLineItemsForFulfillment([]); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmFulfillmentRequest}
                disabled={lineItemsForFulfillment.filter(p => !p.hasExistingRequest).length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate Request
              </button>
            </div>
          </div>
        </div>
      )}

    </main>

      {/* Invoice Tooltip - rendered via Portal to document.body to avoid all overflow clipping issues */}
      {portalMounted && invoiceTooltip.visible && invoiceTooltip.invoices.length > 0 && createPortal(
        <div
          className="fixed z-[99999] bg-gray-900 text-white text-sm rounded-lg shadow-xl px-4 py-3 min-w-[220px] max-w-[280px] pointer-events-none"
          style={{
            left: Math.min(invoiceTooltip.x, window.innerWidth - 300),
            top: invoiceTooltip.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-semibold mb-2 text-base text-blue-400">
            {invoiceTooltip.invoices.length === 1 ? 'Invoice Details' : 'Linked Invoices'}
          </div>
          {invoiceTooltip.invoices.map((inv) => (
            <div key={inv.id} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b border-gray-700 last:border-0">
              <div className="font-medium text-blue-400">{inv.invoiceNumber}</div>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Total:</span>
                  <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.total)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${inv.status === 'paid' ? 'text-green-400' : inv.status === 'open' ? 'text-blue-400' : ''}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Date:</span>
                  <span className="font-medium">{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                </div>
                {inv.lineItems.length === 0 && (
                  <div className="text-amber-400 italic text-xs mt-1">
                    Unknown line items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
