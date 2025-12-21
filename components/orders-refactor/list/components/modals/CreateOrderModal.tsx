/**
 * CreateOrderModal Component
 * Multi-step modal for creating new orders
 */

'use client';

import React, { useState } from 'react';
import {
  mockManufacturers,
  mockCustomers,
  mockSalesReps,
  mockProducts,
  getProductsByManufacturer,
  generateOrderNumber,
  calculateLineItemTotal,
  calculateCommission,
  calculateOrderTotals,
} from '@/lib/data/rms-mock';
import {
  Order,
  OrderLineItem,
  OrderSplitRate,
} from '@/lib/types/rms';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
}

interface DraftLineItem {
  id: string;
  productId: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  commissionRate: number;
}

export function CreateOrderModal({ isOpen, onClose, onSave }: CreateOrderModalProps) {
  const [step, setStep] = useState(1);
  const [manufacturerId, setManufacturerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedShipDate, setRequestedShipDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [freight, setFreight] = useState(0);
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([]);
  const [splitRates, setSplitRates] = useState<OrderSplitRate[]>([]);

  const selectedManufacturer = mockManufacturers.find(m => m.id === manufacturerId);
  const selectedCustomer = mockCustomers.find(c => c.id === customerId);
  const availableProducts = manufacturerId ? getProductsByManufacturer(manufacturerId) : [];

  if (!isOpen) return null;

  const addLineItem = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const newItem: DraftLineItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      partNumber: product.partNumber,
      description: product.description,
      quantity: 1,
      unitPrice: product.unitPrice,
      commissionRate: product.commissionRate || selectedManufacturer?.baseCommissionRate || 0.08,
    };

    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof DraftLineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
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

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotalCommission = () => {
    return lineItems.reduce((sum, item) =>
      sum + calculateCommission(item.quantity * item.unitPrice, item.commissionRate), 0
    );
  };

  const totalSplitPercentage = splitRates.reduce((sum, sr) => sum + sr.splitPercentage, 0);

  const canProceed = () => {
    if (step === 1) return manufacturerId && customerId;
    if (step === 2) return lineItems.length > 0;
    if (step === 3) return splitRates.length > 0 && totalSplitPercentage === 100;
    return true;
  };

  const handleSave = (asDraft: boolean = false) => {
    const subtotal = calculateSubtotal();
    const totalCommission = calculateTotalCommission();

    const finalLineItems: OrderLineItem[] = lineItems.map((item, idx) => ({
      id: `OLI-NEW-${idx + 1}`,
      lineNumber: idx + 1,
      productId: item.productId,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      extendedPrice: item.quantity * item.unitPrice,
      commissionRate: item.commissionRate,
      commissionAmount: calculateCommission(item.quantity * item.unitPrice, item.commissionRate),
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
      id: `ORD-NEW-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      manufacturerId,
      manufacturerName: selectedManufacturer?.name || '',
      customerId,
      customerName: selectedCustomer?.name || '',
      status: asDraft ? 'draft' : 'open',
      fulfillmentStatus: 'not_started',
      billingStatus: 'not_invoiced',
      commissionStatus: 'pending',
      orderDate,
      requestedShipDate: requestedShipDate || undefined,
      lineItems: finalLineItems,
      subtotal,
      freight,
      total: subtotal + freight,
      totalCommission,
      splitRates: finalSplitRates,
      poNumber: poNumber || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      updatedAt: new Date().toISOString(),
    };

    onSave(newOrder);
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create New Order</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Step {step} of 4: {step === 1 ? 'Select Customer & Manufacturer' : step === 2 ? 'Add Line Items' : step === 3 ? 'Commission Splits' : 'Review & Save'}
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
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  s <= step ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Customer & Manufacturer */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Manufacturer *
                </label>
                <select
                  value={manufacturerId}
                  onChange={(e) => {
                    setManufacturerId(e.target.value);
                    setLineItems([]);
                  }}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a manufacturer...</option>
                  {mockManufacturers.filter(m => m.isActive).map((mfg) => (
                    <option key={mfg.id} value={mfg.id}>
                      {mfg.name} ({(mfg.baseCommissionRate * 100).toFixed(0)}% comm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a customer...</option>
                  {mockCustomers.filter(c => c.isActive).map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

          {/* Step 2: Line Items */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Add Product */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Add Product
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addLineItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select a product to add...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.partNumber} - {product.description} ({formatCurrency(product.unitPrice)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items List */}
              <div className="space-y-3">
                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg">
                    No line items added yet. Select a product above to get started.
                  </div>
                ) : (
                  lineItems.map((item, index) => (
                    <div key={item.id} className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {index + 1}. {item.partNumber}
                          </span>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.description}</p>
                        </div>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Comm %</label>
                          <input
                            type="number"
                            step="0.01"
                            value={(item.commissionRate * 100).toFixed(1)}
                            onChange={(e) => updateLineItem(item.id, 'commissionRate', (parseFloat(e.target.value) || 0) / 100)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Extended</label>
                          <div className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-sm">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Freight */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Freight
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={freight}
                  onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                  className="w-full max-w-xs px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              {/* Totals */}
              {lineItems.length > 0 && (
                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
                    <span className="text-sm text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Freight</span>
                    <span className="text-sm text-[var(--foreground)]">{formatCurrency(freight)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(calculateSubtotal() + freight)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-green-600">Total Commission</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(calculateTotalCommission())}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Commission Splits */}
          {step === 3 && (
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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Customer</span>
                      <span className="text-[var(--foreground)]">{selectedCustomer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Manufacturer</span>
                      <span className="text-[var(--foreground)]">{selectedManufacturer?.name}</span>
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
                      <span className="text-[var(--muted-foreground)]">Subtotal</span>
                      <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Freight</span>
                      <span className="text-[var(--foreground)]">{formatCurrency(freight)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-[var(--border)] pt-2">
                      <span className="text-[var(--foreground)]">Total</span>
                      <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal() + freight)}</span>
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
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Line Items ({lineItems.length})</h4>
                <div className="bg-[var(--muted)]/30 rounded-lg divide-y divide-[var(--border)]">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="px-4 py-2 flex justify-between">
                      <span className="text-sm text-[var(--foreground)]">
                        {item.quantity}x {item.partNumber}
                      </span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(item.quantity * item.unitPrice)}</span>
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
            {step === 4 && (
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Save as Draft
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => handleSave(false)}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Create Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
