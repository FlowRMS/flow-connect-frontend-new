/**
 * CreateInvoiceModal Component
 * Modal for creating new invoices from orders
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  mockOrders,
  generateInvoiceNumber,
} from '@/lib/data/rms-mock';
import type { Invoice, InvoiceLineItem, OrderLineItem } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  preselectedOrderId?: string;
}

export function CreateInvoiceModal({
  onClose,
  onSave,
  preselectedOrderId,
}: CreateInvoiceModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(
    preselectedOrderId || ''
  );
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Get orders that can be invoiced (shipped or partial shipped, not fully invoiced)
  const invoiceableOrders = useMemo(() => {
    return mockOrders.filter(
      (o) =>
        (o.status === 'shipped' || o.status === 'partial_shipped') &&
        o.billingStatus !== 'invoiced'
    );
  }, []);

  const selectedOrder = mockOrders.find((o) => o.id === selectedOrderId);

  // Get line items that can still be invoiced
  const invoiceableLineItems = useMemo(() => {
    if (!selectedOrder) return [];
    return selectedOrder.lineItems.filter(
      (item) =>
        !item.isCancelled &&
        item.quantityShipped > item.quantityInvoiced
    );
  }, [selectedOrder]);

  // Initialize quantities when order changes
  useEffect(() => {
    if (selectedOrder) {
      const newQuantities: Record<string, number> = {};
      const newSelected = new Set<string>();
      invoiceableLineItems.forEach((item) => {
        const availableQty = item.quantityShipped - item.quantityInvoiced;
        newQuantities[item.id] = availableQty;
        newSelected.add(item.id);
      });
      setQuantities(newQuantities);
      setSelectedLineItems(newSelected);
    }
  }, [selectedOrderId, invoiceableLineItems, selectedOrder]);

  const toggleLineItem = (itemId: string) => {
    const newSelected = new Set(selectedLineItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedLineItems(newSelected);
  };

  const updateQuantity = (itemId: string, qty: number) => {
    const item = invoiceableLineItems.find((i) => i.id === itemId);
    if (!item) return;
    const maxQty = item.quantityShipped - item.quantityInvoiced;
    setQuantities({
      ...quantities,
      [itemId]: Math.min(Math.max(0, qty), maxQty),
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalCommission = 0;

    invoiceableLineItems.forEach((item) => {
      if (selectedLineItems.has(item.id)) {
        const qty = quantities[item.id] || 0;
        const amount = qty * item.unitPrice;
        subtotal += amount;
        totalCommission += amount * item.commissionRate;
      }
    });

    return {
      subtotal,
      freight: 0, // Could be prorated from order
      total: subtotal,
      totalCommission,
    };
  };

  const totals = calculateTotals();

  const canSave =
    selectedOrderId && selectedLineItems.size > 0 && totals.subtotal > 0;

  const handleSave = () => {
    if (!selectedOrder || !canSave) return;

    const lineItems: InvoiceLineItem[] = invoiceableLineItems
      .filter((item) => selectedLineItems.has(item.id))
      .map((item, idx) => ({
        id: `ILI-NEW-${idx + 1}`,
        orderLineItemId: item.id,
        lineNumber: idx + 1,
        partNumber: item.partNumber || '',
        description: item.description,
        quantity: quantities[item.id] || 0,
        unitPrice: item.unitPrice,
        amount: (quantities[item.id] || 0) * item.unitPrice,
        commissionRate: item.commissionRate,
        commissionAmount:
          (quantities[item.id] || 0) *
          item.unitPrice *
          item.commissionRate,
      }));

    const newInvoice: Invoice = {
      id: `INV-NEW-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      manufacturerId: selectedOrder.manufacturerId,
      manufacturerName: selectedOrder.manufacturerName,
      customerId: selectedOrder.customerId,
      customerName: selectedOrder.customerName,
      status: 'open',
      isLocked: false,
      invoiceDate,
      dueDate,
      lineItems,
      subtotal: totals.subtotal,
      freight: totals.freight,
      total: totals.total,
      totalCommission: totals.totalCommission,
      amountPaid: 0,
      amountCredited: 0,
      balance: totals.total,
      splitRates: selectedOrder.splitRates.map((sr) => ({
        ...sr,
        commissionAmount:
          totals.totalCommission * (sr.splitPercentage / 100),
      })),
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      insideRepId: selectedOrder.insideRepId,
      insideRepName: selectedOrder.insideRepName,
      entryDate: new Date().toISOString().split('T')[0],
    };

    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Create Invoice
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Invoice shipped order items
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select Order *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">Select an order to invoice...</option>
              {invoiceableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} (
                  {formatCurrency(order.total)})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Dates */}
          {selectedOrder && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>
          )}

          {/* Line Items */}
          {selectedOrder && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Line Items to Invoice
              </label>
              {invoiceableLineItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg">
                  No items available for invoicing on this order.
                </div>
              ) : (
                <div className="space-y-2">
                  {invoiceableLineItems.map((item) => {
                    const availableQty =
                      item.quantityShipped - item.quantityInvoiced;
                    const isSelected = selectedLineItems.has(item.id);
                    const qty = quantities[item.id] || 0;

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] bg-[var(--muted)]/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLineItem(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-sm font-medium text-[var(--foreground)]">
                                  {item.partNumber}
                                </span>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-[var(--foreground)]">
                                {formatCurrency(qty * item.unitPrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  Qty:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={availableQty}
                                  value={qty}
                                  onChange={(e) =>
                                    updateQuantity(
                                      item.id,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  disabled={!isSelected}
                                  className="w-20 px-2 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-50"
                                />
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  of {availableQty} available
                                </span>
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                @ {formatCurrency(item.unitPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          {selectedOrder && selectedLineItems.size > 0 && (
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Subtotal
                </span>
                <span className="text-sm text-[var(--foreground)]">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Total
                </span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-green-600">
                  Total Commission
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(totals.totalCommission)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

