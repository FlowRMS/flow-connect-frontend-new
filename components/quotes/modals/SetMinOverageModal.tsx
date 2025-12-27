'use client';

import React from 'react';
import type { LineItem } from '../types';

interface SetMinOverageModalProps {
  show: boolean;
  quoteLineItems: LineItem[];
  selectedLineItems: Set<string>;
  minOverageInput: string;
  onClose: () => void;
  onSetMinOverageInput: (value: string) => void;
  onApply: (minOveragePercent: number) => void;
}

export function SetMinOverageModal({
  show,
  quoteLineItems,
  selectedLineItems,
  minOverageInput,
  onClose,
  onSetMinOverageInput,
  onApply,
}: SetMinOverageModalProps) {
  if (!show) return null;

  const selectedItems = quoteLineItems.filter(li => selectedLineItems.has(li.id));
  const unlockedSelectedItems = selectedItems.filter(li => !li.locked);
  const lockedCount = selectedItems.filter(li => li.locked).length;
  const minOveragePercent = parseFloat(minOverageInput) || 0;
  const affectedItems = unlockedSelectedItems.filter(item => item.overagePercent < minOveragePercent);

  // Calculate preview (only for unlocked items)
  const currentSellTotal = unlockedSelectedItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const newSellTotal = unlockedSelectedItems.reduce((sum, item) => {
    if (item.overagePercent < minOveragePercent) {
      return sum + (item.basePrice * (1 + minOveragePercent / 100) * item.quantity);
    }
    return sum + (item.sellPrice * item.quantity);
  }, 0);

  const handleClose = () => {
    onSetMinOverageInput('');
    onClose();
  };

  const handleApply = () => {
    const minPercent = parseFloat(minOverageInput) || 0;
    if (minPercent > 0) {
      onApply(minPercent);
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Minimum Overage</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Only update line items where the current overage is below the minimum. Lines already at or above the minimum will not be changed.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Minimum Overage %
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={minOverageInput}
                onChange={(e) => onSetMinOverageInput(e.target.value)}
                placeholder="10"
                className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                autoFocus
              />
              <span className="text-sm text-[var(--muted-foreground)]">%</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Selected Lines:</span>
              <span className="text-[var(--foreground)]">{selectedItems.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Lines Below Minimum:</span>
              <span className={`font-medium ${affectedItems.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {affectedItems.length}
              </span>
            </div>
            {minOverageInput && (
              <>
                <div className="border-t border-[var(--border)] pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Current Sell Total:</span>
                    <span className="text-[var(--foreground)]">${currentSellTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[var(--muted-foreground)]">New Sell Total:</span>
                    <span className="font-medium text-green-600">${newSellTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[var(--muted-foreground)]">Difference:</span>
                    <span className="font-medium text-green-600">+${(newSellTotal - currentSellTotal).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Affected Items List */}
          {affectedItems.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-[var(--border)] rounded-lg">
              <div className="px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Lines to Update
              </div>
              {affectedItems.slice(0, 5).map(item => (
                <div key={item.id} className="px-3 py-2 flex justify-between text-sm border-t border-[var(--border)]">
                  <span className="truncate max-w-[200px]">{item.productNumber}</span>
                  <span className="text-red-600">{item.overagePercent.toFixed(1)}% → <span className="text-green-600">{minOveragePercent.toFixed(1)}%</span></span>
                </div>
              ))}
              {affectedItems.length > 5 && (
                <div className="px-3 py-2 text-xs text-center text-[var(--muted-foreground)] border-t border-[var(--border)]">
                  +{affectedItems.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!minOverageInput || affectedItems.length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update {affectedItems.length} Line{affectedItems.length !== 1 ? 's' : ''}
            {lockedCount > 0 && (
              <span className="ml-1 text-xs opacity-75">({lockedCount} locked)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
