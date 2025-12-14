'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockOrders,
  mockManufacturers,
  mockCustomers,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate } from '../../lib/types/rms';
import {
  Order,
  OrderStatus,
  orderStatusLabels,
  orderStatusColors,
  fulfillmentStatusLabels,
  fulfillmentStatusColors,
  billingStatusLabels,
  billingStatusColors,
  commissionStatusLabels,
  commissionStatusColors,
} from '../../lib/types/rms';
import CreateOrderModal from './CreateOrderModal';

type SortField = 'orderNumber' | 'customerName' | 'manufacturerName' | 'orderDate' | 'total' | 'totalCommission' | 'status';
type SortDirection = 'asc' | 'desc';

interface DateRange {
  start: string;
  end: string;
}

interface ColumnFilters {
  orderNumber: string;
  customerName: string[];
  manufacturerName: string[];
  orderDate: DateRange;
  total: string[];
  totalCommission: string[];
  status: string[];
}

export default function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    orderNumber: '',
    customerName: [],
    manufacturerName: [],
    orderDate: { start: '', end: '' },
    total: [],
    totalCommission: [],
    status: [],
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Bulk actions state
  const [selectedOrdersForBulk, setSelectedOrdersForBulk] = useState<Set<string>>(new Set());
  const [showOrdersBulkActionsMenu, setShowOrdersBulkActionsMenu] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);

  // Credit modal state
  const [creditName, setCreditName] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toLocaleDateString('en-US'));
  const [creditLineItems, setCreditLineItems] = useState<{partNumber: string; amount: number; quantity: number; unitCredit: number; commissionPercent: number; commissionAmount: number; reason: string}[]>([]);

  // Acknowledgement modal state
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackLineItems, setAckLineItems] = useState<{lineId: string; partNumber: string; orderedQty: number; acknowledgedQty: number}[]>([]);

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(() =>
    [...new Set(orders.map(o => o.customerName))].sort(), [orders]);
  const uniqueManufacturers = useMemo(() =>
    [...new Set(orders.map(o => o.manufacturerName))].sort(), [orders]);
  const uniqueStatuses = useMemo(() =>
    [...new Set(orders.map(o => o.status))].sort(), [orders]);
  const uniqueOrderDates = useMemo(() =>
    [...new Set(orders.map(o => o.orderDate))].sort().reverse(), [orders]);
  const uniqueTotals = useMemo(() =>
    [...new Set(orders.map(o => o.total))].sort((a, b) => b - a), [orders]);
  const uniqueCommissions = useMemo(() =>
    [...new Set(orders.map(o => o.totalCommission))].sort((a, b) => b - a), [orders]);

  const hasActiveFilters = useMemo(() => {
    return columnFilters.orderNumber !== '' ||
      columnFilters.customerName.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.orderDate.start !== '' || columnFilters.orderDate.end !== '' ||
      columnFilters.total.length > 0 ||
      columnFilters.totalCommission.length > 0 ||
      columnFilters.status.length > 0;
  }, [columnFilters]);

  const clearAllFilters = () => {
    setColumnFilters({
      orderNumber: '',
      customerName: [],
      manufacturerName: [],
      orderDate: { start: '', end: '' },
      total: [],
      totalCommission: [],
      status: [],
    });
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedOrder) {
      setEditedSplits([...selectedOrder.splitRates]);
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
    // Recalculate commission amount based on new percentage
    if (selectedOrder) {
      updated[index].commissionAmount = (selectedOrder.totalCommission * newPercentage) / 100;
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
    if (selectedOrder) {
      const totalPercentage = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedOrder = {
        ...selectedOrder,
        splitRates: editedSplits,
      };
      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply column filters
    if (columnFilters.orderNumber) {
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(columnFilters.orderNumber.toLowerCase())
      );
    }
    if (columnFilters.customerName.length > 0) {
      result = result.filter(o => columnFilters.customerName.includes(o.customerName));
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter(o => columnFilters.manufacturerName.includes(o.manufacturerName));
    }
    if (columnFilters.status.length > 0) {
      result = result.filter(o => columnFilters.status.includes(o.status));
    }
    if (columnFilters.orderDate.start || columnFilters.orderDate.end) {
      result = result.filter(o => {
        const date = new Date(o.orderDate);
        if (columnFilters.orderDate.start && date < new Date(columnFilters.orderDate.start)) return false;
        if (columnFilters.orderDate.end && date > new Date(columnFilters.orderDate.end)) return false;
        return true;
      });
    }
    if (columnFilters.total.length > 0) {
      result = result.filter(o => columnFilters.total.includes(o.total.toString()));
    }
    if (columnFilters.totalCommission.length > 0) {
      result = result.filter(o => columnFilters.totalCommission.includes(o.totalCommission.toString()));
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'orderNumber':
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'manufacturerName':
          comparison = a.manufacturerName.localeCompare(b.manufacturerName);
          break;
        case 'orderDate':
          comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'totalCommission':
          comparison = a.totalCommission - b.totalCommission;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [orders, sortField, sortDirection, columnFilters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${sortField === field && sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${sortField === field && sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );

  const MultiSelectFilterDropdown = ({
    filterId,
    options,
    value,
    onChange,
    placeholder = 'All'
  }: {
    filterId: string;
    options: { value: string; label: string }[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value.length > 0;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optValue: string) => {
      if (value.includes(optValue)) {
        onChange(value.filter(v => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
            setSearchTerm('');
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {hasValue && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
              {value.length}
            </span>
          )}
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div>
                ) : (
                  filteredOptions.map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(opt.value)}
                        onChange={() => toggleOption(opt.value)}
                        className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                      />
                      <span className={value.includes(opt.value) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>
                        {opt.label}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {hasValue && (
                <div className="p-2 border-t border-[var(--border)]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const DateRangeFilterDropdown = ({
    filterId,
    value,
    onChange,
  }: {
    filterId: string;
    value: DateRange;
    onChange: (value: DateRange) => void;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value.start !== '' || value.end !== '';

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter by date range"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label>
                  <input
                    type="date"
                    value={value.start}
                    onChange={(e) => onChange({ ...value, start: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label>
                  <input
                    type="date"
                    value={value.end}
                    onChange={(e) => onChange({ ...value, end: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {hasValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ start: '', end: '' });
                    }}
                    className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const TextFilterDropdown = ({
    filterId,
    value,
    onChange,
    placeholder = 'Filter...'
  }: {
    filterId: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value !== '';

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {hasValue && (
                <button
                  onClick={() => {
                    onChange('');
                    setOpenFilter(null);
                  }}
                  className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const filterOptions = [
    { id: 'order-number', label: 'Order Number', type: 'text' as const },
    { id: 'customer', label: 'Customer', type: 'dropdown' as const },
    { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' as const },
    { id: 'sales-rep', label: 'Sales Rep', type: 'dropdown' as const },
    { id: 'order-date', label: 'Order Date', type: 'date' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateOrder = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setShowCreateModal(false);
  };

  // Check if an order is linked to other entities (invoices, checks, etc.)
  const isOrderLinked = (order: Order) => {
    // Order is linked if it has invoices or is on a commission check
    return order.billingStatus !== 'not_invoiced' || order.commissionStatus === 'paid';
  };

  const getOrderLinkedReason = (order: Order) => {
    const reasons: string[] = [];
    if (order.billingStatus !== 'not_invoiced') {
      reasons.push('has invoices');
    }
    if (order.commissionStatus === 'paid') {
      reasons.push('is on a commission check');
    }
    return `Cannot select: Order ${reasons.join(' and ')}`;
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedOrder ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Orders</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage sales orders and track fulfillment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdvancedFilters filterOptions={filterOptions} />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                New Order
              </button>
            </div>
          </div>

        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Bulk Actions Bar */}
            {selectedOrdersForBulk.size > 0 && (
              <div className="px-4 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">
                  <strong>{selectedOrdersForBulk.size}</strong> order{selectedOrdersForBulk.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowOrdersBulkActionsMenu(!showOrdersBulkActionsMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Bulk Actions
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showOrdersBulkActionsMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowOrdersBulkActionsMenu(false)} />
                        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                          {/* Set Status submenu */}
                          <div className="relative group">
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="10" cy="10" r="8"/>
                                  <path d="M10 6v4l2 2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Set Status
                              </span>
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              {(['draft', 'open', 'partial_shipped', 'shipped', 'cancelled', 'dormant'] as OrderStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    setOrders(prev => prev.map(o =>
                                      selectedOrdersForBulk.has(o.id) ? { ...o, status } : o
                                    ));
                                    setSelectedOrdersForBulk(new Set());
                                    setShowOrdersBulkActionsMenu(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${orderStatusColors[status]}`}>
                                    {orderStatusLabels[status]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-[var(--border)] my-1"></div>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${selectedOrdersForBulk.size} order(s)? This action cannot be undone.`)) {
                                setOrders(prev => prev.filter(o => !selectedOrdersForBulk.has(o.id)));
                                setSelectedOrdersForBulk(new Set());
                                setShowOrdersBulkActionsMenu(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M5 6v11a2 2 0 002 2h6a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedOrdersForBulk(new Set())}
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
            <div className="min-w-[1850px]">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_40px_120px_100px_100px_100px_90px_90px_90px_90px_140px_140px_100px_120px_120px_1fr_60px] gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 sticky top-0">
                {/* Checkbox column */}
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.filter(o => !isOrderLinked(o)).length > 0 && filteredOrders.filter(o => !isOrderLinked(o)).every(o => selectedOrdersForBulk.has(o.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Only select orders that are not linked to other entities
                        setSelectedOrdersForBulk(new Set(filteredOrders.filter(o => !isOrderLinked(o)).map(o => o.id)));
                      } else {
                        setSelectedOrdersForBulk(new Set());
                      }
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </div>
                <div className="flex items-center justify-center">
                  {/* Preview column header - empty */}
                </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleSort('orderNumber')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Order #
                      <SortIcon field="orderNumber" />
                    </button>
                    <TextFilterDropdown
                      filterId="orderNumber"
                      value={columnFilters.orderNumber}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, orderNumber: value }))}
                      placeholder="Search orders..."
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Factory SO
                    </span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleSort('status')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Status
                      <SortIcon field="status" />
                    </button>
                    <MultiSelectFilterDropdown
                      filterId="status"
                      options={uniqueStatuses.map(s => ({ value: s, label: orderStatusLabels[s as keyof typeof orderStatusLabels] }))}
                      value={columnFilters.status}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))}
                      placeholder="All Statuses"
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleSort('total')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Amount
                      <SortIcon field="total" />
                    </button>
                    <MultiSelectFilterDropdown
                      filterId="total"
                      options={uniqueTotals.map(t => ({ value: t.toString(), label: formatCurrency(t) }))}
                      value={columnFilters.total}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, total: value }))}
                      placeholder="All Totals"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleSort('orderDate')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Order Date
                      <SortIcon field="orderDate" />
                    </button>
                    <DateRangeFilterDropdown
                      filterId="orderDate"
                      value={columnFilters.orderDate}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, orderDate: value }))}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Entry Date
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Ship Date
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Due Date
                    </span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleSort('manufacturerName')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Factory
                      <SortIcon field="manufacturerName" />
                    </button>
                    <MultiSelectFilterDropdown
                      filterId="manufacturerName"
                      options={uniqueManufacturers.map(m => ({ value: m, label: m }))}
                      value={columnFilters.manufacturerName}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, manufacturerName: value }))}
                      placeholder="All Factories"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleSort('customerName')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Customer
                      <SortIcon field="customerName" />
                    </button>
                    <MultiSelectFilterDropdown
                      filterId="customerName"
                      options={uniqueCustomers.map(c => ({ value: c, label: c }))}
                      value={columnFilters.customerName}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, customerName: value }))}
                      placeholder="All Customers"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Inside Rep
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Outside Reps
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleSort('totalCommission')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                    >
                      Commission
                      <SortIcon field="totalCommission" />
                    </button>
                    <MultiSelectFilterDropdown
                      filterId="totalCommission"
                      options={uniqueCommissions.map(c => ({ value: c.toString(), label: formatCurrency(c) }))}
                      value={columnFilters.totalCommission}
                      onChange={(value) => setColumnFilters(prev => ({ ...prev, totalCommission: value }))}
                      placeholder="All Commissions"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Job Name
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Visible
                    </span>
                  </div>
                </div>

              {/* Table Body */}
              <div className="divide-y divide-[var(--border)]">
                {filteredOrders.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No orders found
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const outsideReps = order.splitRates
                      .filter(sr => sr.salesRepId !== order.insideRepId)
                      .map(sr => `${sr.salesRepName} (${sr.splitPercentage}%)`)
                      .join(', ');

                    return (
                      <div
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className={`grid grid-cols-[40px_40px_120px_100px_100px_100px_90px_90px_90px_90px_140px_140px_100px_120px_120px_1fr_60px] gap-2 px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                          selectedOrder?.id === order.id ? 'bg-[var(--muted)]/30' : ''
                        } ${selectedOrdersForBulk.has(order.id) ? 'bg-[var(--primary)]/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center justify-center relative group" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrdersForBulk.has(order.id)}
                            disabled={isOrderLinked(order)}
                            onChange={(e) => {
                              setSelectedOrdersForBulk(prev => {
                                const newSet = new Set(prev);
                                if (e.target.checked) {
                                  newSet.add(order.id);
                                } else {
                                  newSet.delete(order.id);
                                }
                                return newSet;
                              });
                            }}
                            className={`w-4 h-4 accent-[var(--primary)] ${isOrderLinked(order) ? 'opacity-40 cursor-not-allowed' : ''}`}
                          />
                          {isOrderLinked(order) && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                              {getOrderLinkedReason(order)}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                            title="Quick preview"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="M21 21l-4.35-4.35"/>
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-[var(--foreground)] truncate">{order.orderNumber}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[var(--muted-foreground)] truncate">{order.factorySoNumber || '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${orderStatusColors[order.status]}`}>
                            {orderStatusLabels[order.status]}
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-[var(--muted-foreground)]">{formatDate(order.orderDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-[var(--muted-foreground)]">{order.entryDate ? formatDate(order.entryDate) : '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-[var(--muted-foreground)]">{order.shipDate ? formatDate(order.shipDate) : '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-[var(--muted-foreground)]">{order.dueDate ? formatDate(order.dueDate) : '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[var(--foreground)] truncate">{order.manufacturerName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[var(--foreground)] truncate">{order.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[var(--muted-foreground)] truncate">{order.insideRepName || '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-[var(--muted-foreground)] truncate" title={outsideReps}>
                            {outsideReps || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm text-green-600">{formatCurrency(order.totalCommission)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-[var(--foreground)] truncate">{order.jobName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          {order.isVisible !== false ? (
                            <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedOrder && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedOrder.orderNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedOrder.customerName}</p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${orderStatusColors[selectedOrder.status]}`}>
                  {orderStatusLabels[selectedOrder.status]}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${fulfillmentStatusColors[selectedOrder.fulfillmentStatus]}`}>
                  {fulfillmentStatusLabels[selectedOrder.fulfillmentStatus]}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${billingStatusColors[selectedOrder.billingStatus]}`}>
                  {billingStatusLabels[selectedOrder.billingStatus]}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${commissionStatusColors[selectedOrder.commissionStatus]}`}>
                  {commissionStatusLabels[selectedOrder.commissionStatus]}
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Order Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Order Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedOrder.orderDate)}</span>
                </div>
                {selectedOrder.requestedShipDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Requested Ship</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedOrder.requestedShipDate)}</span>
                  </div>
                )}
                {selectedOrder.actualShipDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Actual Ship</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedOrder.actualShipDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedOrder.manufacturerName}</span>
                </div>
                {selectedOrder.poNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">PO Number</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedOrder.poNumber}</span>
                  </div>
                )}
                {selectedOrder.jobName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Job</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedOrder.jobName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Line Items ({selectedOrder.lineItems.length})
              </h3>
              <div className="space-y-2">
                {selectedOrder.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                        {item.isCancelled && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Cancelled</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(item.extendedPrice)}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-1">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}</span>
                      <span className="text-green-600">Comm: {formatCurrency(item.commissionAmount)}</span>
                    </div>
                    {item.quantityShipped > 0 && (
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Shipped: {item.quantityShipped} | Invoiced: {item.quantityInvoiced}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Splits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Commission Splits</h3>
                {!editingSplits ? (
                  <button
                    onClick={startEditingSplits}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${Math.abs(splitPercentageTotal - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                      Total: {splitPercentageTotal.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {!editingSplits ? (
                <div className="space-y-2">
                  {selectedOrder.splitRates.map((split, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3">
                      <div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{split.salesRepName}</span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">{split.splitPercentage}%</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(split.commissionAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {editedSplits.map((split, idx) => (
                    <div key={idx} className="bg-[var(--muted)]/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={split.salesRepId}
                          onChange={(e) => updateSplitRep(idx, e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select Rep...</option>
                          {mockSalesReps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSplit(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove split"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={split.splitPercentage}
                          onChange={(e) => updateSplitPercentage(idx, parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">%</span>
                        <span className="ml-auto text-sm font-medium text-green-600">
                          {formatCurrency(split.commissionAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addNewSplit}
                    className="w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    + Add Split
                  </button>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={cancelEditingSplits}
                      className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSplits}
                      disabled={Math.abs(splitPercentageTotal - 100) > 0.01}
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Order Totals</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Freight</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(selectedOrder.freight)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Total Commission</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(selectedOrder.totalCommission)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg p-3">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                Edit Order
              </button>
              <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                Go to Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateOrder}
        />
      )}

      {/* Credit Modal */}
      {showCreditModal && (
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
                onClick={() => setShowCreditModal(false)}
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
                      <div className="text-sm text-green-600 font-medium">{item.partNumber}</div>
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
                <div className="text-xs text-[var(--muted-foreground)] mt-1 px-2">
                  {creditLineItems.length > 0 && `1 - ${creditLineItems.length}`}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Credit created successfully');
                  setShowCreditModal(false);
                  setSelectedOrdersForBulk(new Set());
                }}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Save Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Acknowledgement Modal */}
      {showAcknowledgementModal && (
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
                  Add Acknowledgements for {Array.from(selectedOrdersForBulk).join(', ')}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  The below acknowledgment number and ship date will be applied to all selected detail lines.
                </p>
              </div>
              <button
                onClick={() => setShowAcknowledgementModal(false)}
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
                    <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                      <div>Part Number</div>
                      <div>Ordered Qty</div>
                      <div>Ack. Qty</div>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {ackLineItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-[1fr_100px_100px] gap-2 px-3 py-2 items-center">
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowAcknowledgementModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Acknowledgement added successfully');
                  setShowAcknowledgementModal(false);
                  setSelectedOrdersForBulk(new Set());
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
