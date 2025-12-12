'use client';

import React, { useState, useMemo } from 'react';
import {
  mockOrders,
  mockInvoices,
  mockCreditReasons,
  generateCreditNumber,
} from '../../lib/data/rms-mock';
import {
  Credit,
  CreditLineItem,
  Order,
  Invoice,
} from '../../lib/types/rms';

interface CreateCreditModalProps {
  onClose: () => void;
  onSave: (credit: Credit) => void;
  preselectedOrderId?: string;
  preselectedInvoiceId?: string;
}

interface DraftCreditItem {
  orderLineItemId: string;
  partNumber: string;
  description: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  commissionRate: number;
  selected: boolean;
}

export default function CreateCreditModal({
  onClose,
  onSave,
  preselectedOrderId,
  preselectedInvoiceId
}: CreateCreditModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId || '');
  const [reasonCode, setReasonCode] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [creditItems, setCreditItems] = useState<DraftCreditItem[]>([]);

  // Get orders that can have credits (shipped or invoiced)
  const creditableOrders = useMemo(() => {
    return mockOrders.filter(o =>
      o.status === 'shipped' ||
      o.status === 'partial_shipped' ||
      o.billingStatus === 'invoiced' ||
      o.billingStatus === 'partial_invoiced'
    );
  }, []);

  const selectedOrder = mockOrders.find(o => o.id === selectedOrderId);

  // Get invoices for selected order
  const orderInvoices = useMemo(() => {
    if (!selectedOrderId) return [];
    return mockInvoices.filter(i => i.orderId === selectedOrderId);
  }, [selectedOrderId]);

  const selectedInvoice = mockInvoices.find(i => i.id === selectedInvoiceId);

  // Initialize credit items when order changes
  React.useEffect(() => {
    if (selectedOrder) {
      const items: DraftCreditItem[] = selectedOrder.lineItems
        .filter(item => !item.isCancelled && (item.quantityShipped > 0 || item.quantityInvoiced > 0))
        .map(item => ({
          orderLineItemId: item.id,
          partNumber: item.partNumber,
          description: item.description,
          maxQuantity: Math.max(item.quantityShipped, item.quantityInvoiced) - item.quantityCredited,
          quantity: 0,
          unitPrice: item.unitPrice,
          commissionRate: item.commissionRate,
          selected: false,
        }));
      setCreditItems(items);
    }
  }, [selectedOrderId, selectedOrder]);

  const toggleItem = (orderLineItemId: string) => {
    setCreditItems(creditItems.map(item =>
      item.orderLineItemId === orderLineItemId
        ? { ...item, selected: !item.selected, quantity: item.selected ? 0 : item.maxQuantity }
        : item
    ));
  };

  const updateQuantity = (orderLineItemId: string, quantity: number) => {
    setCreditItems(creditItems.map(item =>
      item.orderLineItemId === orderLineItemId
        ? { ...item, quantity: Math.min(Math.max(0, quantity), item.maxQuantity) }
        : item
    ));
  };

  const selectedItems = creditItems.filter(item => item.selected && item.quantity > 0);

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalCommissionDeduction = 0;

    selectedItems.forEach(item => {
      const amount = item.quantity * item.unitPrice;
      totalAmount += amount;
      totalCommissionDeduction += amount * item.commissionRate;
    });

    return { totalAmount, totalCommissionDeduction };
  };

  const totals = calculateTotals();

  const selectedReason = mockCreditReasons.find(r => r.code === reasonCode);
  const canSave = selectedOrderId && reasonCode && selectedItems.length > 0 && totals.totalAmount > 0;

  const handleSave = () => {
    if (!selectedOrder || !canSave || !selectedReason) return;

    const lineItems: CreditLineItem[] = selectedItems.map((item, idx) => ({
      id: `CLI-NEW-${idx + 1}`,
      orderLineItemId: item.orderLineItemId,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      commissionDeduction: item.quantity * item.unitPrice * item.commissionRate,
    }));

    const newCredit: Credit = {
      id: `CRD-NEW-${Date.now()}`,
      creditNumber: generateCreditNumber(),
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      invoiceId: selectedInvoiceId || undefined,
      invoiceNumber: selectedInvoice?.invoiceNumber,
      manufacturerId: selectedOrder.manufacturerId,
      manufacturerName: selectedOrder.manufacturerName,
      customerId: selectedOrder.customerId,
      customerName: selectedOrder.customerName,
      reasonCode: reasonCode,
      reasonDescription: selectedReason.description,
      status: 'open',
      lineItems,
      totalAmount: totals.totalAmount,
      totalCommissionDeduction: totals.totalCommissionDeduction,
      splitRates: selectedOrder.splitRates.map(sr => ({
        ...sr,
        commissionAmount: -(totals.totalCommissionDeduction * (sr.splitPercentage / 100))
      })),
      creditDate,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
    };

    onSave(newCredit);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Credit</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Issue a credit memo for an order</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
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
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                setSelectedInvoiceId('');
              }}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">Select an order...</option>
              {creditableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} ({formatCurrency(order.total)})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Selection (optional) */}
          {selectedOrder && orderInvoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Related Invoice (optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="">No specific invoice</option>
                {orderInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} ({formatCurrency(invoice.total)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason & Date */}
          {selectedOrder && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Reason *
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a reason...</option>
                  {mockCreditReasons.filter(r => r.isActive).map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Credit Date
                </label>
                <input
                  type="date"
                  value={creditDate}
                  onChange={(e) => setCreditDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>
          )}

          {/* Line Items */}
          {selectedOrder && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Items to Credit
              </label>
              {creditItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg">
                  No items available for credit on this order.
                </div>
              ) : (
                <div className="space-y-2">
                  {creditItems.map((item) => (
                    <div
                      key={item.orderLineItemId}
                      className={`border rounded-lg p-3 transition-colors ${
                        item.selected
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-[var(--border)] bg-[var(--muted)]/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItem(item.orderLineItemId)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.description}</p>
                            </div>
                            <span className="text-sm font-medium text-red-600">
                              -{formatCurrency(item.quantity * item.unitPrice)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--muted-foreground)]">Qty:</span>
                              <input
                                type="number"
                                min="0"
                                max={item.maxQuantity}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.orderLineItemId, parseInt(e.target.value) || 0)}
                                disabled={!item.selected}
                                className="w-20 px-2 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-50"
                              />
                              <span className="text-xs text-[var(--muted-foreground)]">
                                max {item.maxQuantity}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              @ {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {selectedOrder && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this credit..."
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
            </div>
          )}

          {/* Totals */}
          {selectedItems.length > 0 && (
            <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[var(--muted-foreground)]">Credit Amount</span>
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(totals.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-500">Commission Deduction</span>
                <span className="text-sm font-medium text-red-500">-{formatCurrency(totals.totalCommissionDeduction)}</span>
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Credit
          </button>
        </div>
      </div>
    </div>
  );
}
