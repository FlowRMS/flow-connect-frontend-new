'use client';

import React, { useState, useMemo } from 'react';
import {
  mockManufacturers,
  mockCustomers,
  mockSalesReps,
  mockProducts,
  generateOrderNumber,
} from '../../lib/data/rms-mock';
import {
  Order,
  OrderLineItem,
  OrderSplitRate,
} from '../../lib/types/rms';

interface QuoteLineItemData {
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
  lineItems: QuoteLineItemData[];
  totalValue: number;
}

interface ConvertQuoteToOrderModalProps {
  quote: QuoteData;
  onClose: () => void;
  onConvert: (order: Order) => void;
}

export default function ConvertQuoteToOrderModal({ quote, onClose, onConvert }: ConvertQuoteToOrderModalProps) {
  const [manufacturerId, setManufacturerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedShipDate, setRequestedShipDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState(`Converted from Quote ${quote.quoteNumber}`);
  const [freight, setFreight] = useState(0);
  const [splitRates, setSplitRates] = useState<OrderSplitRate[]>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set(quote.lineItems.map(li => li.id))
  );

  const selectedManufacturer = mockManufacturers.find(m => m.id === manufacturerId);

  // Group line items by manufacturer from quote
  const lineItemsByManufacturer = useMemo(() => {
    const groups: Record<string, QuoteLineItemData[]> = {};
    quote.lineItems.forEach(item => {
      const mfg = item.manufacturer || 'Unknown';
      if (!groups[mfg]) groups[mfg] = [];
      groups[mfg].push(item);
    });
    return groups;
  }, [quote.lineItems]);

  const manufacturers = Object.keys(lineItemsByManufacturer);

  const toggleLineItem = (itemId: string) => {
    const newSelected = new Set(selectedLineItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedLineItems(newSelected);
  };

  const selectAllForManufacturer = (mfg: string) => {
    const newSelected = new Set(selectedLineItems);
    lineItemsByManufacturer[mfg]?.forEach(item => newSelected.add(item.id));
    setSelectedLineItems(newSelected);
  };

  const deselectAllForManufacturer = (mfg: string) => {
    const newSelected = new Set(selectedLineItems);
    lineItemsByManufacturer[mfg]?.forEach(item => newSelected.delete(item.id));
    setSelectedLineItems(newSelected);
  };

  const addSplitRate = () => {
    if (splitRates.length >= 3) return;
    setSplitRates([...splitRates, { salesRepId: '', salesRepName: '', splitPercentage: 0, commissionAmount: 0 }]);
  };

  const updateSplitRate = (index: number, salesRepId: string, splitPercentage: number) => {
    const rep = mockSalesReps.find(r => r.id === salesRepId);
    setSplitRates(splitRates.map((sr, i) =>
      i === index
        ? { salesRepId, salesRepName: rep?.name || '', splitPercentage, commissionAmount: 0 }
        : sr
    ));
  };

  const removeSplitRate = (index: number) => {
    setSplitRates(splitRates.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return quote.lineItems
      .filter(item => selectedLineItems.has(item.id))
      .reduce((sum, item) => sum + (item.quantity * item.sellPrice), 0);
  };

  const calculateTotalCommission = () => {
    const baseRate = selectedManufacturer?.baseCommissionRate || 0.08;
    return calculateSubtotal() * baseRate;
  };

  const totalSplitPercentage = splitRates.reduce((sum, sr) => sum + sr.splitPercentage, 0);

  const canConvert = customerId && selectedLineItems.size > 0 && splitRates.length > 0 && totalSplitPercentage === 100;

  const handleConvert = () => {
    if (!canConvert) return;

    const selectedCustomer = mockCustomers.find(c => c.id === customerId);
    const baseCommRate = selectedManufacturer?.baseCommissionRate || 0.08;

    // Create line items from selected quote items
    const orderLineItems: OrderLineItem[] = quote.lineItems
      .filter(item => selectedLineItems.has(item.id))
      .map((item, idx) => {
        const extendedPrice = item.quantity * item.sellPrice;
        return {
          id: `OLI-CONV-${idx + 1}`,
          lineNumber: idx + 1,
          productId: item.id,
          partNumber: item.partNumber,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.sellPrice,
          extendedPrice,
          commissionRate: baseCommRate,
          commissionAmount: extendedPrice * baseCommRate,
          quantityShipped: 0,
          quantityInvoiced: 0,
          quantityCredited: 0,
          isCancelled: false,
        };
      });

    const subtotal = calculateSubtotal();
    const totalCommission = calculateTotalCommission();

    const finalSplitRates: OrderSplitRate[] = splitRates.map(sr => ({
      ...sr,
      commissionAmount: totalCommission * (sr.splitPercentage / 100),
    }));

    // Find manufacturer ID from the first selected item
    const firstSelectedItem = quote.lineItems.find(item => selectedLineItems.has(item.id));
    const mfgMatch = mockManufacturers.find(m =>
      m.name.toLowerCase().includes(firstSelectedItem?.manufacturer?.toLowerCase() || '')
    );

    const newOrder: Order = {
      id: `ORD-CONV-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      manufacturerId: manufacturerId || mfgMatch?.id || 'MFG-001',
      manufacturerName: selectedManufacturer?.name || mfgMatch?.name || firstSelectedItem?.manufacturer || 'Unknown',
      customerId,
      customerName: selectedCustomer?.name || '',
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      jobName: quote.projectName,
      status: 'open',
      fulfillmentStatus: 'not_started',
      billingStatus: 'not_invoiced',
      commissionStatus: 'pending',
      orderDate,
      requestedShipDate: requestedShipDate || undefined,
      lineItems: orderLineItems,
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
              {quote.quoteNumber} - {quote.projectName}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quote Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Converting from Quote</span>
            </div>
            <p className="text-sm text-blue-600">
              Customer: {quote.customerName} | Total Value: {formatCurrency(quote.totalValue)} | {quote.lineItems.length} items
            </p>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="">Select customer...</option>
                {mockCustomers.filter(c => c.isActive).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Manufacturer (for commission)
              </label>
              <select
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="">Auto-detect from items</option>
                {mockManufacturers.filter(m => m.isActive).map((mfg) => (
                  <option key={mfg.id} value={mfg.id}>
                    {mfg.name} ({(mfg.baseCommissionRate * 100).toFixed(0)}% comm)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Customer PO"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Line Items Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select Line Items to Include ({selectedLineItems.size} of {quote.lineItems.length} selected)
            </label>

            {manufacturers.map(mfg => (
              <div key={mfg} className="mb-4">
                <div className="flex items-center justify-between bg-[var(--muted)]/50 px-3 py-2 rounded-t-lg">
                  <span className="text-sm font-medium text-[var(--foreground)]">{mfg}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllForManufacturer(mfg)}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => deselectAllForManufacturer(mfg)}
                      className="text-xs text-[var(--muted-foreground)] hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="border border-[var(--border)] border-t-0 rounded-b-lg divide-y divide-[var(--border)]">
                  {lineItemsByManufacturer[mfg]?.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLineItems.has(item.id)}
                        onChange={() => toggleLineItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                        <span className="text-xs text-[var(--muted-foreground)] ml-2 truncate">{item.description}</span>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">Qty: {item.quantity}</span>
                      <span className="text-sm font-medium text-[var(--foreground)] w-24 text-right">
                        {formatCurrency(item.quantity * item.sellPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Commission Splits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Commission Splits *
              </label>
              <button
                onClick={addSplitRate}
                disabled={splitRates.length >= 3}
                className="text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
              >
                + Add Split
              </button>
            </div>

            {splitRates.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg p-3">
                Add at least one sales rep split to continue.
              </p>
            ) : (
              <div className="space-y-2">
                {splitRates.map((split, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[var(--muted)]/30 rounded-lg p-3">
                    <select
                      value={split.salesRepId}
                      onChange={(e) => updateSplitRate(index, e.target.value, split.splitPercentage)}
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                    >
                      <option value="">Select rep...</option>
                      {mockSalesReps.filter(r => r.isActive).map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.name} ({rep.repType})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={split.splitPercentage}
                        onChange={(e) => updateSplitRate(index, split.salesRepId, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                    <button
                      onClick={() => removeSplitRate(index)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <p className={`text-xs ${totalSplitPercentage === 100 ? 'text-green-600' : 'text-red-500'}`}>
                  Total: {totalSplitPercentage}% {totalSplitPercentage !== 100 && '(must equal 100%)'}
                </p>
              </div>
            )}
          </div>

          {/* Freight & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Freight
              </label>
              <input
                type="number"
                step="0.01"
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Order Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Subtotal ({selectedLineItems.size} items)</span>
                <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Freight</span>
                <span className="text-[var(--foreground)]">{formatCurrency(freight)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-[var(--border)] pt-2">
                <span className="text-[var(--foreground)]">Total</span>
                <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal() + freight)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Est. Commission ({((selectedManufacturer?.baseCommissionRate || 0.08) * 100).toFixed(0)}%)</span>
                <span className="font-medium text-green-600">{formatCurrency(calculateTotalCommission())}</span>
              </div>
            </div>
          </div>
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
            onClick={handleConvert}
            disabled={!canConvert}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert to Order
          </button>
        </div>
      </div>
    </div>
  );
}
