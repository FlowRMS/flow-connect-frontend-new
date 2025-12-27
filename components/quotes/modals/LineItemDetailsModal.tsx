'use client';

import React from 'react';
import { LineItem, ColumnKey } from '../types';

interface LineItemDetailsModalProps {
  show: boolean;
  lineItem: LineItem | null;
  effectiveVisibleColumns: Set<ColumnKey>;
  showEndUserPerLine: boolean;
  onClose: () => void;
  onUpdateLineItem: (id: string, updates: Partial<LineItem>) => void;
}

export function LineItemDetailsModal({
  show,
  lineItem,
  effectiveVisibleColumns,
  showEndUserPerLine,
  onClose,
  onUpdateLineItem,
}: LineItemDetailsModalProps) {
  if (!show || !lineItem) return null;

  const handleUpdate = (field: keyof LineItem, value: unknown) => {
    onUpdateLineItem(lineItem.id, { [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Additional Details</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{lineItem.productNumber} - {lineItem.description}</p>
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
        <div className="p-6 space-y-4">
          {/* Only show fields that are NOT visible in the table */}

          {/* Quantity - only show if not in table */}
          {!effectiveVisibleColumns.has('quantity') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Quantity</label>
              <input
                type="number"
                value={lineItem.quantity}
                onChange={(e) => handleUpdate('quantity', parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          )}

          {/* Manufacturer - only show if not in table */}
          {!effectiveVisibleColumns.has('manufacturer') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Manufacturer</label>
              <span className="text-sm text-[var(--foreground)]">{lineItem.manufacturers[0]?.name || '—'}</span>
            </div>
          )}

          {/* Unit Price - only show if not in table */}
          {!effectiveVisibleColumns.has('unitPrice') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Sell Price</label>
              <input
                type="number"
                step="0.01"
                value={lineItem.sellPrice}
                onChange={(e) => handleUpdate('sellPrice', parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          )}

          {/* Sell Total - only show if not in table */}
          {!effectiveVisibleColumns.has('sellTotal') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Sell Total</label>
              <span className="text-sm text-[var(--foreground)]">${(lineItem.sellPrice * lineItem.quantity).toFixed(2)}</span>
            </div>
          )}

          {/* End User - only show if End User Per Line is enabled AND not visible in table */}
          {showEndUserPerLine && !effectiveVisibleColumns.has('endUser') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">End User</label>
              <input
                type="text"
                value={lineItem.endUser || ''}
                onChange={(e) => handleUpdate('endUser', e.target.value)}
                placeholder="Enter end user"
                className="w-40 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          )}

          {/* Commission Discount % - only show if not in table */}
          {!effectiveVisibleColumns.has('commissionDiscountPercent') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Commission Discount %</label>
              <div className="relative w-24">
                <input
                  type="number"
                  value={lineItem.commissionDiscountPercent || 0}
                  onChange={(e) => handleUpdate('commissionDiscountPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
              </div>
            </div>
          )}

          {/* Commission Discount $ - only show if not in table */}
          {!effectiveVisibleColumns.has('commissionDiscountAmount') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Commission Discount $</label>
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  value={lineItem.commissionDiscountAmount || 0}
                  onChange={(e) => handleUpdate('commissionDiscountAmount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pl-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* Line Discount % - only show if not in table */}
          {!effectiveVisibleColumns.has('lineDiscountPercent') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Line Discount %</label>
              <div className="relative w-24">
                <input
                  type="number"
                  value={lineItem.lineDiscountPercent || 0}
                  onChange={(e) => handleUpdate('lineDiscountPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
              </div>
            </div>
          )}

          {/* Line Discount $ - only show if not in table */}
          {!effectiveVisibleColumns.has('lineDiscountAmount') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Line Discount $</label>
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  value={lineItem.lineDiscountAmount || 0}
                  onChange={(e) => handleUpdate('lineDiscountAmount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pl-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* Lead Time - only show if not in table */}
          {!effectiveVisibleColumns.has('leadTime') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Lead Time</label>
              <input
                type="text"
                value={lineItem.leadTime || ''}
                onChange={(e) => handleUpdate('leadTime', e.target.value)}
                placeholder="e.g. 2-3 weeks"
                className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          )}

          {/* UOM - only show if not in table */}
          {!effectiveVisibleColumns.has('uom') && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">UOM</label>
              <span className="text-sm text-[var(--foreground)]">{lineItem.uom || 'EA'}</span>
            </div>
          )}

          {/* Multiplier/Divisor - only show if not in table */}
          {!effectiveVisibleColumns.has('divisor') && lineItem.useDivisor && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Multiplier</label>
              <span className="text-sm text-[var(--foreground)]">{lineItem.divisor}</span>
            </div>
          )}

          {/* Spec Sheet - only show if not in table */}
          {!effectiveVisibleColumns.has('specSheet') && lineItem.hasSpecSheet && lineItem.specSheetUrl && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--muted-foreground)]">Spec Sheet</label>
              <a href={lineItem.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline">View</a>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
