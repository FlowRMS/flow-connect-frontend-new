'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockOrders,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate } from '../../lib/types/rms';
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

type TabType = 'line-items' | 'files' | 'notes' | 'activity';

export default function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [showPricingSummary, setShowPricingSummary] = useState(true);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

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

  // Mock activity data
  const activities = [
    { id: 1, type: 'created', user: 'System', description: 'Order created', date: order?.orderDate || '' },
    { id: 2, type: 'status', user: 'John Smith', description: 'Status changed to Confirmed', date: order?.orderDate || '' },
  ];

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
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {/* Back Button */}
              <button
                onClick={() => router.push('/orders')}
                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{order.orderNumber}</h1>

              {/* Order Status Dropdown */}
              <div className="relative">
                <select
                  value={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Order['status'];
                    setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                  }}
                  className={`appearance-none px-3 py-1 pr-8 rounded-full text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-offset-1 ${orderStatusColors[order.status]}`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_production">In Production</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Status Tags */}
            <div className="flex flex-wrap gap-2 ml-8">
              <span className={`px-2.5 py-0.5 text-xs rounded-full ${fulfillmentStatusColors[order.fulfillmentStatus]}`}>
                {fulfillmentStatusLabels[order.fulfillmentStatus]}
              </span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full ${billingStatusColors[order.billingStatus]}`}>
                {billingStatusLabels[order.billingStatus]}
              </span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full ${commissionStatusColors[order.commissionStatus]}`}>
                {commissionStatusLabels[order.commissionStatus]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action Buttons */}
            <button
              onClick={() => alert('Edit order')}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => router.push(`/invoices?order=${order.id}`)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Go to Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0">
        <button
          onClick={() => setShowPricingSummary(!showPricingSummary)}
          className="w-full flex items-center justify-between px-6 py-2 hover:bg-[var(--muted)]/30 transition-colors"
        >
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {showPricingSummary ? 'Pricing Summary' : 'Show Pricing Summary'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--muted-foreground)] transition-transform ${showPricingSummary ? '' : 'rotate-180'}`}
          >
            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showPricingSummary && (
          <div className="flex items-center justify-end gap-8 px-6 pb-4">
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Subtotal</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(order.subtotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Freight</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(order.freight)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Total</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(order.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Commission</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(order.totalCommission)}</p>
            </div>
          </div>
        )}
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
            {/* Row 1: Order Number, Customer, Factory, Job, PO Number, Factory SO */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Order Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={order.orderNumber}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Customer<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={order.customerName}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Factory<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={order.manufacturerName}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Job
                </label>
                <input
                  type="text"
                  value={order.jobName || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  value={order.poNumber || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Factory SO #
                </label>
                <input
                  type="text"
                  value={order.factorySoNumber || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Order Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formatDate(order.orderDate)}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Entry Date
                </label>
                <input
                  type="text"
                  value={order.entryDate ? formatDate(order.entryDate) : ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Ship Date
                </label>
                <input
                  type="text"
                  value={order.shipDate ? formatDate(order.shipDate) : (order.requestedShipDate ? formatDate(order.requestedShipDate) : '')}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Due Date
                </label>
                <input
                  type="text"
                  value={order.dueDate ? formatDate(order.dueDate) : ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Inside Rep
                </label>
                <input
                  type="text"
                  value={order.insideRepName || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1">
        {/* Left Content - Tabs */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-[var(--border)] bg-[var(--card)]">
            <div className="flex gap-0">
              {[
                { id: 'line-items', label: 'Line Items', count: order.lineItems.length },
                { id: 'files', label: 'Files', count: 0 },
                { id: 'notes', label: 'Notes', count: order.notes ? 1 : 0 },
                { id: 'activity', label: 'Activity Feed', count: activities.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-[var(--muted)] rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'line-items' && (
              <div className="space-y-3">
                {order.lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden"
                  >
                    {/* Line Item Header */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-[var(--muted)]/30">
                      <span className="text-sm font-medium text-[var(--muted-foreground)]">#{index + 1}</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">{item.partNumber}</span>
                      {item.isCancelled && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Cancelled</span>
                      )}
                      <div className="ml-auto text-sm font-semibold text-[var(--foreground)]">
                        {formatCurrency(item.extendedPrice)}
                      </div>
                    </div>

                    {/* Line Item Details */}
                    <div className="p-4">
                      <p className="text-sm text-[var(--foreground)] mb-3">{item.description}</p>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--muted-foreground)]">Quantity</span>
                          <p className="font-medium text-[var(--foreground)]">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Unit Price</span>
                          <p className="font-medium text-[var(--foreground)]">{formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Shipped</span>
                          <p className="font-medium text-[var(--foreground)]">{item.quantityShipped}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Invoiced</span>
                          <p className="font-medium text-[var(--foreground)]">{item.quantityInvoiced}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Commission</span>
                          <p className="font-medium text-green-600">{formatCurrency(item.commissionAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="text-center py-12">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--muted-foreground)] mb-4">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-[var(--muted-foreground)]">No files attached to this order</p>
                <button className="mt-4 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Upload File
                </button>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {order.notes ? (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--foreground)]">{order.notes}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--muted-foreground)] mb-4">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-[var(--muted-foreground)]">No notes for this order</p>
                    <button className="mt-4 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                      Add Note
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--foreground)]">
                        <span className="font-medium">{activity.user}</span> {activity.description}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] flex-shrink-0 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Sales Representatives */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide">Sales Representatives</h3>
                {!editingSplits ? (
                  <button
                    onClick={startEditingSplits}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <span className={`text-xs ${Math.abs(splitPercentageTotal - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                    Total: {splitPercentageTotal.toFixed(1)}%
                  </span>
                )}
              </div>

              {!editingSplits ? (
                <div className="space-y-2">
                  {order.splitRates.map((split, idx) => (
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

            {/* Order Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-4">Order Totals</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="text-[var(--foreground)]">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Freight</span>
                  <span className="text-[var(--foreground)]">{formatCurrency(order.freight)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="font-semibold text-[var(--foreground)]">Total</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Commission</span>
                  <span className="font-semibold text-green-600">{formatCurrency(order.totalCommission)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors text-left">
                  Print Order
                </button>
                <button className="w-full px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors text-left">
                  Email Customer
                </button>
                <button className="w-full px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors text-left">
                  Duplicate Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
