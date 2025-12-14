'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockOrders,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate, OrderLineItem } from '../../lib/types/rms';
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
type ColumnKey = 'partNumber' | 'custPartNumber' | 'description' | 'uom' | 'divisor' | 'unitPrice' | 'quantity' | 'shippedQty' | 'lineStatus' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'invoiced' | 'percentOver' | 'commissionAmount' | 'ovgPercent' | 'ovgAmount' | 'earnPercent' | 'earnAmount';

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
};

const defaultVisibleColumns: ColumnKey[] = [
  'quantity',
  'uom',
  'divisor',
  'unitPrice',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
];

// Helper function to get line item shipping status
const getLineShipStatus = (quantity: number, shippedQty: number): { label: string; color: string } => {
  if (shippedQty === 0) {
    return { label: 'Open', color: 'bg-gray-100 text-gray-700' };
  } else if (shippedQty < quantity) {
    return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' };
  } else if (shippedQty === quantity) {
    return { label: 'Complete', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: 'Overshipped', color: 'bg-red-100 text-red-700' };
  }
};

// Helper function to get overall order shipping status
const getOrderShipStatus = (lineItems: { quantity: number; quantityShipped: number; partNumber: string }[]): { label: string; color: string } => {
  // Filter out freight lines
  const productLines = lineItems.filter(item => item.partNumber !== 'FREIGHT');
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
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(defaultVisibleColumns));
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Line item bulk actions state
  const [showLineItemsBulkActionsMenu, setShowLineItemsBulkActionsMenu] = useState(false);
  const [showLineCreditModal, setShowLineCreditModal] = useState(false);
  const [showLineAcknowledgementModal, setShowLineAcknowledgementModal] = useState(false);
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [showSetOutsideRepSplitsModal, setShowSetOutsideRepSplitsModal] = useState(false);
  const [bulkOveragePercent, setBulkOveragePercent] = useState('');
  const [bulkEndUser, setBulkEndUser] = useState('');

  // Credit modal state
  const [creditName, setCreditName] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toLocaleDateString('en-US'));
  const [creditLineItems, setCreditLineItems] = useState<{partNumber: string; amount: number; quantity: number; unitCredit: number; commissionPercent: number; commissionAmount: number; reason: string}[]>([]);

  // Acknowledgement modal state
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackLineItems, setAckLineItems] = useState<{lineId: string; partNumber: string; orderedQty: number; acknowledgedQty: number; shipDate: string}[]>([]);

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
      } else {
        newSet.add(col);
      }
      return newSet;
    });
  };

  // Get status color for the stage dropdown button
  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-blue-100 text-blue-700',
      partial_shipped: 'bg-orange-100 text-orange-700',
      shipped: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
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
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add New Lines from Quotes
                  </button>
                </div>
              )}
            </div>

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
                  {(['draft', 'open', 'partial_shipped', 'shipped', 'cancelled'] as Order['status'][]).map((status) => (
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
                              onClick={() => {
                                // Initialize credit line items from selected line items
                                const items = order.lineItems.filter(li => selectedLineItems.has(li.id)).map(li => ({
                                  partNumber: `${li.partNumber} (${formatCurrency(li.unitPrice * li.quantity)})`,
                                  amount: li.unitPrice * li.quantity,
                                  quantity: li.quantity,
                                  unitCredit: li.unitPrice * li.quantity,
                                  commissionPercent: 0.75,
                                  commissionAmount: li.unitPrice * li.quantity * 0.0075,
                                  reason: ''
                                }));
                                setCreditLineItems(items);
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
                                  partNumber: li.partNumber,
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
                      {/* Dynamic columns */}
                      {visibleColumns.has('partNumber') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            Part #
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]/50">
                              <path d="M8 6l4 4-4 4"/>
                            </svg>
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('custPartNumber') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Cust Part #
                        </th>
                      )}
                      {visibleColumns.has('description') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            Description
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]/50">
                              <path d="M8 6l4 4-4 4"/>
                            </svg>
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
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedLineItems.has(item.id)}
                            onChange={() => toggleLineItemSelection(item.id)}
                            className="accent-[var(--primary)]"
                          />
                        </td>
                        {visibleColumns.has('partNumber') && (
                          <td className="px-3 py-2 text-sm">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.partNumber}
                                className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded"
                                readOnly
                              />
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('custPartNumber') && (
                          <td className="px-3 py-2 text-sm">
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
                          <td className="px-3 py-2 text-sm max-w-[200px]">
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
                          <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
                        )}
                        {visibleColumns.has('shippedQty') && (
                          <td className="px-3 py-2 text-sm text-center">
                            {item.partNumber === 'FREIGHT' ? '' : item.quantityShipped}
                          </td>
                        )}
                        {visibleColumns.has('lineStatus') && (
                          <td className="px-3 py-2 text-sm text-center">
                            {item.partNumber !== 'FREIGHT' && (() => {
                              const status = getLineShipStatus(item.quantity, item.quantityShipped);
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.has('sellTotal') && (
                          <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.extendedPrice)}</td>
                        )}
                        {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">
                            {item.partNumber === 'FREIGHT' ? '' : `${((item.commissionRate || 0.08) * 100).toFixed(0)}%`}
                          </td>
                        )}
                        {visibleColumns.has('commission') && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">
                            {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
                          </td>
                        )}
                        {visibleColumns.has('commissionTotal') && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600 font-medium">
                            {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
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
                    const items = order.lineItems.map(li => ({
                      lineId: li.id,
                      partNumber: li.partNumber,
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
                <p className="text-sm text-[var(--muted-foreground)]">Check columns to show in table</p>
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
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-1">
                {(Object.keys(columnLabels) as ColumnKey[]).map(colKey => (
                  <div
                    key={colKey}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/50 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(colKey)}
                      onChange={() => toggleColumn(colKey)}
                      className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                    />
                    <span className="flex-1 text-sm font-medium">{columnLabels[colKey]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
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
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v12M6 12h12"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Creating Credit <span className="text-green-600">({formatCurrency(creditLineItems.reduce((sum, li) => sum + li.unitCredit, 0))})</span>
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">Enter credit information, verify your entries, and save</p>
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

              {/* Credit Line Items */}
              <div>
                <div className="grid grid-cols-[1fr_80px_140px_120px_140px_140px] gap-4 px-2 py-2 bg-[var(--muted)]/30 rounded-t-lg text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <div>Part Number</div>
                  <div>Quantity *</div>
                  <div>Unit Credit *</div>
                  <div>Commission % *</div>
                  <div>Commission Amount *</div>
                  <div>Reason *</div>
                </div>
                <div className="border border-[var(--border)] rounded-b-lg divide-y divide-[var(--border)]">
                  {creditLineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_80px_140px_120px_140px_140px] gap-4 px-2 py-3 items-center">
                      <input
                        type="text"
                        value={item.partNumber}
                        onChange={(e) => {
                          const newItems = [...creditLineItems];
                          newItems[index].partNumber = e.target.value;
                          setCreditLineItems(newItems);
                        }}
                        className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                        placeholder="Enter part number"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...creditLineItems];
                          newItems[index].quantity = parseInt(e.target.value) || 0;
                          setCreditLineItems(newItems);
                        }}
                        className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                      />
                      <input
                        type="text"
                        value={`$${item.unitCredit.toFixed(2)}`}
                        onChange={(e) => {
                          const newItems = [...creditLineItems];
                          newItems[index].unitCredit = parseFloat(e.target.value.replace('$', '')) || 0;
                          setCreditLineItems(newItems);
                        }}
                        className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={item.commissionPercent}
                          onChange={(e) => {
                            const newItems = [...creditLineItems];
                            newItems[index].commissionPercent = parseFloat(e.target.value) || 0;
                            newItems[index].commissionAmount = newItems[index].unitCredit * (newItems[index].commissionPercent / 100);
                            setCreditLineItems(newItems);
                          }}
                          className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-20"
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">%</span>
                      </div>
                      <input
                        type="text"
                        value={`$${item.commissionAmount.toFixed(2)}`}
                        readOnly
                        className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--muted)]/30"
                      />
                      <select
                        value={item.reason}
                        onChange={(e) => {
                          const newItems = [...creditLineItems];
                          newItems[index].reason = e.target.value;
                          setCreditLineItems(newItems);
                        }}
                        className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                      >
                        <option value="">Choose</option>
                        <option value="price_adjustment">Price Adjustment</option>
                        <option value="return">Return</option>
                        <option value="damaged">Damaged</option>
                        <option value="wrong_item">Wrong Item</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 px-2">
                  <button
                    onClick={() => {
                      setCreditLineItems([...creditLineItems, {
                        partNumber: '',
                        amount: 0,
                        quantity: 1,
                        unitCredit: 0,
                        commissionPercent: 0.75,
                        commissionAmount: 0,
                        reason: ''
                      }]);
                    }}
                    className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                    </svg>
                    Add Line
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {creditLineItems.length > 0 && `${creditLineItems.length} line${creditLineItems.length !== 1 ? 's' : ''}`}
                  </span>
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
                  alert('Credit created successfully');
                  setShowLineCreditModal(false);
                  setSelectedLineItems(new Set());
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
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
              {ackLineItems.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Acknowledged Quantity per Line Item
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">
                    The acknowledged quantity may be less than the full ordered quantity for partial acknowledgements.
                  </p>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_120px] gap-2 px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                      <div>Part Number</div>
                      <div>Ordered Qty</div>
                      <div>Ack. Qty</div>
                      <div>Ship Date</div>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {ackLineItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-[1fr_80px_80px_120px] gap-2 px-3 py-2 items-center">
                          <span className="text-sm">{item.partNumber}</span>
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
    </main>
  );
}
