/**
 * LineCreditModal Component
 * Modal for creating credit line items with calculations
 */

'use client';

import React, { useState } from 'react';
import type { Order, OrderLineItem } from '@/lib/types/rms';
import { formatCurrency } from '../../../utils';

interface CreditLineItem {
  partNumber: string;
  linkedLineItemId: string | null;
  creditType: '' | 'return' | 'short_ship' | 'cancel' | 'damage';
  quantity: number; // Stored as negative
  unitPrice: number;
  creditAmount: number;
  commissionPercent: number;
  commissionAmount: number;
}

interface LineCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmit: () => void;
}

export function LineCreditModal({
  isOpen,
  onClose,
  order,
  onSubmit,
}: LineCreditModalProps) {
  const [creditName, setCreditName] = useState('');
  const [creditDate, setCreditDate] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditLineItems, setCreditLineItems] = useState<CreditLineItem[]>([
    {
      partNumber: '',
      linkedLineItemId: null,
      creditType: '',
      quantity: 0,
      unitPrice: 0,
      creditAmount: 0,
      commissionPercent: 8,
      commissionAmount: 0,
    },
  ]);

  if (!isOpen) return null;

  const totalCreditAmount = creditLineItems.reduce((sum, li) => sum + li.creditAmount, 0);
  const canSubmit = creditName && creditDate && creditLineItems.every(item => item.creditType);

  return (
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
              Creating Credit <span className="text-red-600">({formatCurrency(totalCreditAmount)})</span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">Credits are applied as negative quantities against the order</p>
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
                  ? order.lineItems.find(li => li.id === item.linkedLineItemId)
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
                              const lineItem = order.lineItems.find(li => li.id === selectedValue);
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
                          {order.lineItems.filter(li => li.partNumber !== 'FREIGHT').map(li => (
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
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">Total Credit:</span>
                  <span className="ml-2 font-semibold text-red-600 text-lg">{formatCurrency(totalCreditAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Credit
          </button>
        </div>
      </div>
    </div>
  );
}
