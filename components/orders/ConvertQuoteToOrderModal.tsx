/**
 * ConvertQuoteToOrderModal Component
 * Modal for converting a quote to an order
 */

'use client';

import React, { useState } from 'react';
import type { Order, OrderLineItem, OrderSplitRate } from '@/lib/types/rms';
import {
  mockSalesReps,
  generateOrderNumber,
} from '@/lib/data/rms-mock';

interface QuoteLineItem {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  sellPrice: number;
}

interface QuoteData {
  id: string;
  quoteNumber: string;
  customerName: string;
  projectName: string;
  lineItems: QuoteLineItem[];
  totalValue: number;
}

interface ConvertQuoteToOrderModalProps {
  quote: QuoteData;
  onClose: () => void;
  onConvert: (order: Order) => void;
}

export default function ConvertQuoteToOrderModal({
  quote,
  onClose,
  onConvert,
}: ConvertQuoteToOrderModalProps) {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    quote.lineItems.map(li => li.id)
  );
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedShipDate, setRequestedShipDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [splitRates, setSplitRates] = useState<OrderSplitRate[]>([]);

  const toggleLineItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(quote.lineItems.map(li => li.id));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const addSplitRate = () => {
    if (splitRates.length >= 3) return;
    setSplitRates([...splitRates, { salesRepId: '', salesRepName: '', splitPercentage: 0, commissionAmount: 0 }]);
  };

  const updateSplitRate = (index: number, salesRepId: string, splitPercentage: number) => {
    const rep = mockSalesReps.find(r => r.id === salesRepId);
    const totalCommission = calculateTotalCommission();
    setSplitRates(splitRates.map((sr, i) =>
      i === index
        ? {
            salesRepId,
            salesRepName: rep?.name || '',
            splitPercentage,
            commissionAmount: totalCommission * (splitPercentage / 100)
          }
        : sr
    ));
  };

  const removeSplitRate = (index: number) => {
    setSplitRates(splitRates.filter((_, i) => i !== index));
  };

  const selectedLineItems = quote.lineItems.filter(li => selectedItems.includes(li.id));

  const calculateSubtotal = () => {
    return selectedLineItems.reduce((sum, item) => sum + (item.quantity * item.sellPrice), 0);
  };

  const calculateTotalCommission = () => {
    // Default 8% commission
    return calculateSubtotal() * 0.08;
  };

  const totalSplitPercentage = splitRates.reduce((sum, sr) => sum + sr.splitPercentage, 0);

  const canProceed = () => {
    if (step === 1) return selectedItems.length > 0;
    if (step === 2) return splitRates.length > 0 && totalSplitPercentage === 100;
    return true;
  };

  const handleConvert = () => {
    const subtotal = calculateSubtotal();
    const totalCommission = calculateTotalCommission();

    const finalLineItems: OrderLineItem[] = selectedLineItems.map((item, idx) => ({
      id: `OLI-${Date.now()}-${idx + 1}`,
      lineNumber: idx + 1,
      productId: item.id,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.sellPrice,
      extendedPrice: item.quantity * item.sellPrice,
      commissionRate: 0.08,
      commissionAmount: (item.quantity * item.sellPrice) * 0.08,
      quantityShipped: 0,
      quantityInvoiced: 0,
      quantityCredited: 0,
      isCancelled: false,
      isConsignment: false,
    }));

    const finalSplitRates: OrderSplitRate[] = splitRates.map(sr => ({
      ...sr,
      commissionAmount: totalCommission * (sr.splitPercentage / 100),
    }));

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      manufacturerId: '',
      manufacturerName: selectedLineItems[0]?.manufacturer || '',
      customerId: '',
      customerName: quote.customerName,
      jobId: '',
      jobName: quote.projectName,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      status: 'open',
      fulfillmentStatus: 'not_started',
      billingStatus: 'not_invoiced',
      commissionStatus: 'pending',
      orderDate,
      requestedShipDate: requestedShipDate || undefined,
      lineItems: finalLineItems,
      subtotal,
      freight: 0,
      total: subtotal,
      totalCommission,
      splitRates: finalSplitRates,
      poNumber: poNumber || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      updatedAt: new Date().toISOString(),
    };

    onConvert(newOrder);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Convert Quote to Order</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {quote.quoteNumber} - {quote.customerName}
            </p>
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

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  s <= step ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Step {step} of 3: {step === 1 ? 'Select Line Items' : step === 2 ? 'Commission Splits' : 'Review & Convert'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Line Items */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--foreground)]">Select Line Items to Convert</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllItems}
                    className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllItems}
                    className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {quote.lineItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItems.includes(item.id)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleLineItem(item.id)}
                      className="w-4 h-4 rounded border-[var(--border)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.partNumber}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--foreground)]">Qty: {item.quantity}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatCurrency(item.sellPrice)}/ea</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(item.quantity * item.sellPrice)}
                    </p>
                  </label>
                ))}
              </div>

              <div className="bg-[var(--muted)]/30 rounded-lg p-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Selected Items</span>
                  <span className="text-[var(--foreground)]">{selectedItems.length} of {quote.lineItems.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="font-semibold text-[var(--foreground)]">Selected Total</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Requested Ship Date
                  </label>
                  <input
                    type="date"
                    value={requestedShipDate}
                    onChange={(e) => setRequestedShipDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Customer PO number"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Commission Splits */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--foreground)]">Commission Splits</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Total commission: {formatCurrency(calculateTotalCommission())}</p>
                </div>
                <button
                  onClick={addSplitRate}
                  disabled={splitRates.length >= 3}
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                >
                  + Add Split
                </button>
              </div>

              {splitRates.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg">
                  No splits configured. Add at least one sales rep split.
                </div>
              ) : (
                <div className="space-y-3">
                  {splitRates.map((split, index) => (
                    <div key={index} className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Sales Rep</label>
                          <select
                            value={split.salesRepId}
                            onChange={(e) => updateSplitRate(index, e.target.value, split.splitPercentage)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                          >
                            <option value="">Select rep...</option>
                            {mockSalesReps.filter(r => r.isActive).map((rep) => (
                              <option key={rep.id} value={rep.id}>
                                {rep.name} ({rep.repType})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Split %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={split.splitPercentage}
                            onChange={(e) => updateSplitRate(index, split.salesRepId, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Amount</label>
                          <div className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-green-600">
                            {formatCurrency(calculateTotalCommission() * (split.splitPercentage / 100))}
                          </div>
                        </div>
                        <button
                          onClick={() => removeSplitRate(index)}
                          className="p-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors mt-5"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Split Total */}
              <div className={`text-sm ${totalSplitPercentage === 100 ? 'text-green-600' : 'text-red-500'}`}>
                Total Split: {totalSplitPercentage}% {totalSplitPercentage !== 100 && '(must equal 100%)'}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Quote</span>
                      <span className="text-[var(--foreground)]">{quote.quoteNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Customer</span>
                      <span className="text-[var(--foreground)]">{quote.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Project</span>
                      <span className="text-[var(--foreground)]">{quote.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Order Date</span>
                      <span className="text-[var(--foreground)]">{orderDate}</span>
                    </div>
                    {requestedShipDate && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">Ship Date</span>
                        <span className="text-[var(--foreground)]">{requestedShipDate}</span>
                      </div>
                    )}
                    {poNumber && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">PO Number</span>
                        <span className="text-[var(--foreground)]">{poNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Order Totals</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Line Items</span>
                      <span className="text-[var(--foreground)]">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-[var(--border)] pt-2">
                      <span className="text-[var(--foreground)]">Total</span>
                      <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Commission</span>
                      <span className="font-semibold">{formatCurrency(calculateTotalCommission())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Preview */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Line Items ({selectedItems.length})</h4>
                <div className="bg-[var(--muted)]/30 rounded-lg divide-y divide-[var(--border)]">
                  {selectedLineItems.map((item) => (
                    <div key={item.id} className="px-4 py-2 flex justify-between">
                      <span className="text-sm text-[var(--foreground)]">
                        {item.quantity}x {item.partNumber}
                      </span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(item.quantity * item.sellPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission Splits Preview */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Commission Splits</h4>
                <div className="bg-[var(--muted)]/30 rounded-lg divide-y divide-[var(--border)]">
                  {splitRates.map((split, idx) => (
                    <div key={idx} className="px-4 py-2 flex justify-between">
                      <span className="text-sm text-[var(--foreground)]">
                        {split.salesRepName} ({split.splitPercentage}%)
                      </span>
                      <span className="text-sm text-green-600">{formatCurrency(calculateTotalCommission() * (split.splitPercentage / 100))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes for this order..."
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleConvert}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Convert to Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
