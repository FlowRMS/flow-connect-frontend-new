/**
 * Create Order from Quote Modal Component
 * Three-step modal: Select line items, enter order details, then redirects to order
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useCreateOrderFromQuote } from '../../orders/api';
import { createLink } from '../../lib/graphql/entity-links';
import type { Order } from '../../orders/api/ordersApi';
import type { QuoteDetailToOrderDetailInput } from '../../lib/graphql/orders';
import type { LineItemV2 } from '../types';

interface LineItemOverride {
  quantity: string;
  unitPrice: string;
  lineDiscountAmount: number;
  commissionDiscountAmount: number;
}

interface CreateOrderFromQuoteModalProps {
  isOpen: boolean;
  quoteId: string;
  quoteNumber: string;
  factoryId?: string;
  factoryName?: string;
  lineItems?: LineItemV2[];
  initialSelectedItemIds?: Set<string>;
  onClose: () => void;
  onSuccess?: (order: Order) => void;
}

type ModalStep = 'select-items' | 'input' | 'success';

export function CreateOrderFromQuoteModal({
  isOpen,
  quoteId,
  quoteNumber,
  factoryId: initialFactoryId = '',
  factoryName: initialFactoryName = '',
  lineItems = [],
  initialSelectedItemIds,
  onClose,
  onSuccess,
}: CreateOrderFromQuoteModalProps) {
  const router = useRouter();
  const createOrderMutation = useCreateOrderFromQuote();

  const [step, setStep] = useState<ModalStep>(lineItems.length > 0 ? 'select-items' : 'input');
  const [orderNumber, setOrderNumber] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Use initialSelectedItemIds if provided (from detail page selection), otherwise default to all items
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    initialSelectedItemIds && initialSelectedItemIds.size > 0
      ? new Set(initialSelectedItemIds)
      : new Set(lineItems.map(item => item.id))
  );

  // State for quantity and unit price overrides per line item (including discounts)
  const [lineItemOverrides, setLineItemOverrides] = useState<Record<string, LineItemOverride>>(() => {
    const overrides: Record<string, LineItemOverride> = {};
    lineItems.forEach(item => {
      overrides[item.id] = {
        quantity: String(item.quantity || '0'),
        unitPrice: String(item.unitPrice || '0'),
        lineDiscountAmount: item.lineDiscountAmount || 0,
        commissionDiscountAmount: item.commissionDiscountAmount || 0,
      };
    });
    return overrides;
  });

  // Sync selection state and overrides when modal opens or initialSelectedItemIds changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(
        initialSelectedItemIds && initialSelectedItemIds.size > 0
          ? new Set(initialSelectedItemIds)
          : new Set(lineItems.map(item => item.id))
      );
      // Initialize overrides with original values (including discounts)
      const overrides: Record<string, LineItemOverride> = {};
      lineItems.forEach(item => {
        overrides[item.id] = {
          quantity: String(item.quantity || '0'),
          unitPrice: String(item.unitPrice || '0'),
          lineDiscountAmount: item.lineDiscountAmount || 0,
          commissionDiscountAmount: item.commissionDiscountAmount || 0,
        };
      });
      setLineItemOverrides(overrides);
    }
  }, [isOpen, initialSelectedItemIds, lineItems]);

  // Derive factory from selected line items (for per-line-item manufacturer quotes)
  const selectedFactory = useMemo(() => {
    const selectedItems = lineItems.filter(item => selectedItemIds.has(item.id));
    if (selectedItems.length === 0) return { id: initialFactoryId, name: initialFactoryName, mixed: false };

    const factoryIds = new Set(selectedItems.map(item => item.manufacturerId).filter(Boolean));
    if (factoryIds.size <= 1) {
      const firstSelected = selectedItems[0];
      return {
        id: firstSelected?.manufacturerId || initialFactoryId,
        name: firstSelected?.manufacturerName || initialFactoryName,
        mixed: false,
      };
    }
    return { id: '', name: '', mixed: true };
  }, [lineItems, selectedItemIds, initialFactoryId, initialFactoryName]);

  // Calculate totals for selected items using overridden values (minus line discounts)
  const selectedTotal = useMemo(() => {
    return lineItems
      .filter(item => selectedItemIds.has(item.id))
      .reduce((sum, item) => {
        const override = lineItemOverrides[item.id];
        if (override) {
          const qty = Number(override.quantity) || 0;
          const price = Number(override.unitPrice) || 0;
          const lineDiscount = override.lineDiscountAmount || 0;
          return sum + (qty * price) - lineDiscount;
        }
        const baseTotal = Number(item.sellTotal) || Number(item.total) || 0;
        const lineDiscount = item.lineDiscountAmount || 0;
        return sum + baseTotal - lineDiscount;
      }, 0);
  }, [lineItems, selectedItemIds, lineItemOverrides]);

  const allSelected = selectedItemIds.size === lineItems.length && lineItems.length > 0;
  const noneSelected = selectedItemIds.size === 0;

  if (!isOpen) return null;

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(lineItems.map(item => item.id)));
    }
  };

  const handleOverrideChange = (itemId: string, field: 'quantity' | 'unitPrice', value: string) => {
    setLineItemOverrides(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleProceedToInput = () => {
    if (noneSelected) {
      setError('Please select at least one line item');
      return;
    }
    if (selectedFactory.mixed) {
      setError('Selected line items belong to different manufacturers. Please select items from a single manufacturer only.');
      return;
    }
    setError(null);
    setStep('input');
  };

  const handleCreate = async () => {
    if (!orderNumber.trim()) {
      setError('Order number is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    setError(null);

    try {
      // Build array of quote detail inputs with quantity and unitPrice overrides
      const quoteDetailsInputs: QuoteDetailToOrderDetailInput[] | undefined =
        lineItems.length > 0
          ? Array.from(selectedItemIds).map(itemId => {
              const override = lineItemOverrides[itemId];
              return {
                quoteDetailId: itemId,
                quantity: override?.quantity || '0',
                unitPrice: override?.unitPrice || '0',
              };
            })
          : undefined;

      const order = await createOrderMutation.mutateAsync({
        quoteId,
        orderNumber: orderNumber.trim(),
        factoryId: selectedFactory.id || initialFactoryId,
        dueDate,
        quoteDetailsInputs,
      });

      // Auto-link the quote to the newly created order
      try {
        await createLink({
          sourceEntityType: 'QUOTE',
          sourceEntityId: quoteId,
          targetEntityType: 'ORDER',
          targetEntityId: order.id,
        });
      } catch (linkError) {
        // Log but don't fail the whole operation if linking fails
        console.warn('Failed to auto-link quote to order:', linkError);
      }

      setCreatedOrder(order);
      setStep('success');
      onSuccess?.(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  const handleRedirectToOrder = () => {
    if (createdOrder) {
      router.push(`/orders/${createdOrder.id}`);
    }
    handleCloseAndReset();
  };

  const handleStayHere = () => {
    handleCloseAndReset();
  };

  const handleCloseAndReset = () => {
    setStep(lineItems.length > 0 ? 'select-items' : 'input');
    setOrderNumber('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setCreatedOrder(null);
    setError(null);
    // Reset to initial selection if provided, otherwise all items
    setSelectedItemIds(
      initialSelectedItemIds && initialSelectedItemIds.size > 0
        ? new Set(initialSelectedItemIds)
        : new Set(lineItems.map(item => item.id))
    );
    // Reset line item overrides to original values (including discounts)
    const overrides: Record<string, LineItemOverride> = {};
    lineItems.forEach(item => {
      overrides[item.id] = {
        quantity: String(item.quantity || '0'),
        unitPrice: String(item.unitPrice || '0'),
        lineDiscountAmount: item.lineDiscountAmount || 0,
        commissionDiscountAmount: item.commissionDiscountAmount || 0,
      };
    });
    setLineItemOverrides(overrides);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {step === 'select-items' ? (
          <>
            {/* Header - Select Items */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Line Items</h3>
                  <p className="text-sm text-gray-500">Choose which items to include in the order</p>
                </div>
              </div>
            </div>

            {/* Body - Line Items Selection */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                {/* Select All Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button
                    onClick={handleToggleAll}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 group-hover:border-indigo-400'
                    }`}>
                      {allSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {!allSelected && selectedItemIds.size > 0 && (
                        <div className="w-2 h-0.5 bg-gray-400 rounded"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {allSelected ? 'Deselect All' : 'Select All'} ({lineItems.length} items)
                    </span>
                  </button>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-indigo-600">{selectedItemIds.size}</span> selected
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  {lineItems.map((item, index) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const override = lineItemOverrides[item.id];
                    const currentQty = Number(override?.quantity) || 0;
                    const currentPrice = Number(override?.unitPrice) || 0;
                    const lineDiscount = override?.lineDiscountAmount || 0;
                    const commDiscount = override?.commissionDiscountAmount || 0;
                    const lineTotal = (currentQty * currentPrice) - lineDiscount;
                    return (
                      <div
                        key={item.id}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleItem(item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Item Number Badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.itemNumber || index + 1}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {item.partNumber || 'Unknown Product'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate mb-3">
                                {item.description}
                              </p>
                            )}
                            {/* Editable Quantity and Unit Price */}
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500 font-medium">Qty:</label>
                                <input
                                  type="number"
                                  value={override?.quantity || ''}
                                  onChange={(e) => handleOverrideChange(item.id, 'quantity', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  min="0"
                                  step="1"
                                />
                                <span className="text-xs text-gray-400">(orig: {Math.round(Number(item.quantity) || 0)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500 font-medium">Unit Price:</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    value={override?.unitPrice || ''}
                                    onChange={(e) => handleOverrideChange(item.id, 'unitPrice', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-24 pl-5 pr-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <span className="text-xs text-gray-400">(orig: {formatCurrency(Number(item.unitPrice) || 0)})</span>
                              </div>
                            </div>
                            {/* Show discounts if any */}
                            {(lineDiscount > 0 || commDiscount > 0) && (
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                {lineDiscount > 0 && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    Line Discount: -{formatCurrency(lineDiscount)}
                                  </span>
                                )}
                                {commDiscount > 0 && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                    Comm. Discount: -{formatCurrency(commDiscount)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Item Total */}
                          <div className="text-right flex-shrink-0">
                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {formatCurrency(lineTotal)}
                            </span>
                            {lineDiscount > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                {formatCurrency(currentQty * currentPrice)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Footer - Selected Total & Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Selected Total:</span>
                  <span className="text-lg font-bold text-indigo-600">{formatCurrency(selectedTotal)}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseAndReset}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToInput}
                    disabled={noneSelected}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : step === 'input' ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Order</h3>
                  <p className="text-sm text-gray-500">From Quote {quoteNumber}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-shrink-0">
              {/* Selected items summary */}
              {lineItems.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">{selectedItemIds.size} of {lineItems.length} items selected</span>
                    </div>
                    <button
                      onClick={() => setStep('select-items')}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Order Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter order number..."
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                    error && !orderNumber.trim() ? 'border-red-300' : 'border-gray-200'
                  }`}
                  autoFocus
                />
              </div>

              {/* Factory - Read-only display derived from selected line items */}
              {(selectedFactory.name || initialFactoryName) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Factory
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700">
                    {selectedFactory.name || initialFactoryName}
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setError(null);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    error && !dueDate ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              <p className="mt-3 text-xs text-gray-500">
                {lineItems.length > 0 && selectedItemIds.size < lineItems.length
                  ? `A new order will be created with the ${selectedItemIds.size} selected items.`
                  : 'A new order will be created with all details from this quote.'
                }
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between flex-shrink-0">
              <div>
                {lineItems.length > 0 && (
                  <button
                    onClick={() => setStep('select-items')}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseAndReset}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createOrderMutation.isPending || !orderNumber.trim() || !dueDate}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Success Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Created!</h3>
                  <p className="text-sm text-gray-500">Order #{createdOrder?.orderNumber}</p>
                </div>
              </div>
            </div>

            {/* Success Body */}
            <div className="px-6 py-6 flex-shrink-0">
              <p className="text-sm text-gray-600 mb-4">
                Your order has been successfully created from the quote. Would you like to view the new order now?
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{createdOrder?.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      Status: {createdOrder?.status || createdOrder?.headerStatus} {createdOrder?.details?.length ? `• ${createdOrder.details.length} line items` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleStayHere}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={handleRedirectToOrder}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                View Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
