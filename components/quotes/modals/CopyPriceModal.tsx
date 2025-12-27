'use client';

import React from 'react';

interface CopyPriceModalProps {
  show: 'l1' | 'l2' | 'l3' | null;
  selectedLineItems: Set<string>;
  totals: { sellTotal: number };
  onClose: () => void;
  onApply: () => void;
}

export function CopyPriceModal({
  show,
  selectedLineItems,
  totals,
  onClose,
  onApply,
}: CopyPriceModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Copy Sell to {show.toUpperCase()}
          </h2>
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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="applyTo" defaultChecked className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">Selected ({selectedLineItems.size} lines)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="applyTo" className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">All lines</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Markup %
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">+</span>
              <input
                type="number"
                defaultValue={show === 'l1' ? 10 : show === 'l2' ? 15 : 20}
                className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
              />
              <span className="text-sm text-[var(--muted-foreground)]">%</span>
            </div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Sell Total:</span>
              <span className="text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">{show.toUpperCase()} Total:</span>
              <span className="font-medium text-[var(--foreground)]">
                ${Math.round(totals.sellTotal * (show === 'l1' ? 1.10 : show === 'l2' ? 1.15 : 1.20)).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              2 lines skipped (locked)
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
