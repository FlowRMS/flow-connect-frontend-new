'use client';

import React from 'react';
import type { Quote, LineItem } from '../types';

interface CreateOrderSelectedItem {
  id: string;
  selected: boolean;
  quantity: number;
}

interface CreateOrderFromQuoteModalProps {
  show: boolean;
  selectedQuote: Quote | null;
  quoteLineItems: LineItem[];
  createOrderSelectAll: boolean;
  createOrderSelectedItems: CreateOrderSelectedItem[];
  onClose: () => void;
  onSetCreateOrderSelectAll: (value: boolean) => void;
  onSetCreateOrderSelectedItems: React.Dispatch<React.SetStateAction<CreateOrderSelectedItem[]>>;
  onCreate: () => void;
}

export function CreateOrderFromQuoteModal({
  show,
  selectedQuote,
  quoteLineItems,
  createOrderSelectAll,
  createOrderSelectedItems,
  onClose,
  onSetCreateOrderSelectAll,
  onSetCreateOrderSelectedItems,
  onCreate,
}: CreateOrderFromQuoteModalProps) {
  if (!show || !selectedQuote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Order from Quote</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Select line items to include in the order</p>
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

        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All Option */}
          <div className="mb-4 flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-lg">
            <input
              type="checkbox"
              checked={createOrderSelectAll}
              onChange={(e) => {
                onSetCreateOrderSelectAll(e.target.checked);
                onSetCreateOrderSelectedItems(prev => prev.map(item => ({
                  ...item,
                  selected: e.target.checked
                })));
              }}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">All line items</span>
            <span className="text-sm text-[var(--muted-foreground)]">({createOrderSelectedItems.filter(i => i.selected).length} of {createOrderSelectedItems.length} selected)</span>
          </div>

          {/* Line Items List */}
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part Number</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-24">Quote Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-28">Order Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Sell Price</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {quoteLineItems.map((item) => {
                  const itemState = createOrderSelectedItems.find(i => i.id === item.id);
                  const isSelected = itemState?.selected ?? true;
                  const orderQuantity = itemState?.quantity ?? item.quantity;
                  return (
                    <tr key={item.id} className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 ${!isSelected ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            onSetCreateOrderSelectedItems(prev => prev.map(i =>
                              i.id === item.id ? { ...i, selected: e.target.checked } : i
                            ));
                            // Update select all state
                            const newItems = createOrderSelectedItems.map(i =>
                              i.id === item.id ? { ...i, selected: e.target.checked } : i
                            );
                            onSetCreateOrderSelectAll(newItems.every(i => i.selected));
                          }}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[var(--foreground)]">{item.productNumber}</td>
                      <td className="px-3 py-2 text-sm text-[var(--muted-foreground)]">{item.description}</td>
                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={orderQuantity}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 1;
                            onSetCreateOrderSelectedItems(prev => prev.map(i =>
                              i.id === item.id ? { ...i, quantity: newQty } : i
                            ));
                          }}
                          disabled={!isSelected}
                          className="w-full px-2 py-1 border border-[var(--border)] rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-[var(--muted)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">${item.sellPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-[var(--foreground)]">
                        ${(item.sellPrice * orderQuantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <div className="bg-[var(--muted)]/30 rounded-lg p-4 min-w-[250px]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--muted-foreground)]">Selected Items:</span>
                <span className="font-medium">{createOrderSelectedItems.filter(i => i.selected).length}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2">
                <span className="text-[var(--muted-foreground)]">Order Total:</span>
                <span className="font-semibold text-[var(--foreground)]">
                  ${createOrderSelectedItems
                    .filter(i => i.selected)
                    .reduce((sum, i) => {
                      const item = quoteLineItems.find(li => li.id === i.id);
                      return sum + (item ? item.sellPrice * i.quantity : 0);
                    }, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={createOrderSelectedItems.filter(i => i.selected).length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}
