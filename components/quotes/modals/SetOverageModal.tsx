'use client';

import React from 'react';
import type { LineItem } from '../types';

type OverageModalTab = 'percentage' | 'targetPrice' | 'targetMargin';

interface SetOverageModalProps {
  show: boolean;
  quoteLineItems: LineItem[];
  selectedLineItems: Set<string>;
  overageModalTab: OverageModalTab;
  overageInputPercent: string;
  overageInputTargetPrice: string;
  overageInputTargetMargin: string;
  onClose: () => void;
  onSetOverageModalTab: (tab: OverageModalTab) => void;
  onSetOverageInputPercent: (value: string) => void;
  onSetOverageInputTargetPrice: (value: string) => void;
  onSetOverageInputTargetMargin: (value: string) => void;
  onApply: (newOveragePercent: number) => void;
}

export function SetOverageModal({
  show,
  quoteLineItems,
  selectedLineItems,
  overageModalTab,
  overageInputPercent,
  overageInputTargetPrice,
  overageInputTargetMargin,
  onClose,
  onSetOverageModalTab,
  onSetOverageInputPercent,
  onSetOverageInputTargetPrice,
  onSetOverageInputTargetMargin,
  onApply,
}: SetOverageModalProps) {
  if (!show) return null;

  // Calculate preview values based on selected items
  const selectedItems = quoteLineItems.filter(li => selectedLineItems.has(li.id));
  const currentBaseTotal = selectedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const currentSellTotal = selectedItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const currentOverage = currentSellTotal - currentBaseTotal;
  const currentAvgOveragePercent = currentBaseTotal > 0 ? (currentOverage / currentBaseTotal) * 100 : 0;

  // Calculate new values based on mode
  let newSellTotal = currentSellTotal;
  let newOveragePercent = currentAvgOveragePercent;
  let newOverageAmount = currentOverage;

  if (overageModalTab === 'percentage' && overageInputPercent) {
    const targetPercent = parseFloat(overageInputPercent) || 0;
    newSellTotal = currentBaseTotal * (1 + targetPercent / 100);
    newOveragePercent = targetPercent;
    newOverageAmount = newSellTotal - currentBaseTotal;
  } else if (overageModalTab === 'targetPrice' && overageInputTargetPrice) {
    newSellTotal = parseFloat(overageInputTargetPrice) || currentSellTotal;
    newOverageAmount = newSellTotal - currentBaseTotal;
    newOveragePercent = currentBaseTotal > 0 ? (newOverageAmount / currentBaseTotal) * 100 : 0;
  } else if (overageModalTab === 'targetMargin' && overageInputTargetMargin) {
    newOverageAmount = parseFloat(overageInputTargetMargin) || currentOverage;
    newSellTotal = currentBaseTotal + newOverageAmount;
    newOveragePercent = currentBaseTotal > 0 ? (newOverageAmount / currentBaseTotal) * 100 : 0;
  }

  // Calculate commission impact (simplified)
  const avgCommissionRate = 0.08; // 8% average
  const avgOverageShare = 0.85; // 85% average
  const currentCommission = (currentBaseTotal * avgCommissionRate) + (currentOverage * avgOverageShare);
  const newCommission = (currentBaseTotal * avgCommissionRate) + (newOverageAmount * avgOverageShare);

  const unlockedCount = quoteLineItems.filter(li => selectedLineItems.has(li.id) && !li.locked).length;
  const lockedCount = quoteLineItems.filter(li => selectedLineItems.has(li.id) && li.locked).length;

  const handleClose = () => {
    onSetOverageModalTab('percentage');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Overage Calculator</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => onSetOverageModalTab('percentage')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              overageModalTab === 'percentage'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Set Percentage
          </button>
          <button
            onClick={() => onSetOverageModalTab('targetPrice')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              overageModalTab === 'targetPrice'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Target Price
          </button>
          <button
            onClick={() => onSetOverageModalTab('targetMargin')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              overageModalTab === 'targetMargin'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Target Margin
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Apply to {selectedLineItems.size} selected line{selectedLineItems.size !== 1 ? 's' : ''} (Base: ${currentBaseTotal.toLocaleString()})
          </p>

          {/* Tab Content */}
          {overageModalTab === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Overage Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={overageInputPercent}
                  onChange={(e) => onSetOverageInputPercent(e.target.value)}
                  className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                  placeholder="10"
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Current avg: {currentAvgOveragePercent.toFixed(1)}%
              </p>
            </div>
          )}

          {overageModalTab === 'targetPrice' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Target Sell Price Total
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  value={overageInputTargetPrice}
                  onChange={(e) => onSetOverageInputTargetPrice(e.target.value)}
                  className="w-36 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                  placeholder={currentSellTotal.toFixed(0)}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Current: ${currentSellTotal.toLocaleString()}
              </p>
            </div>
          )}

          {overageModalTab === 'targetMargin' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Target Margin Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  value={overageInputTargetMargin}
                  onChange={(e) => onSetOverageInputTargetMargin(e.target.value)}
                  className="w-36 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                  placeholder={currentOverage.toFixed(0)}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Current margin: ${currentOverage.toLocaleString()}
              </p>
            </div>
          )}

          {/* Preview Section */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Current</p>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Sell:</span>
                    <span>${currentSellTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Overage:</span>
                    <span>${currentOverage.toLocaleString()} ({currentAvgOveragePercent.toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Commission:</span>
                    <span>${currentCommission.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-xs text-[var(--muted-foreground)]">New</p>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Sell:</span>
                    <span className={newSellTotal !== currentSellTotal ? 'text-[var(--primary)] font-medium' : ''}>
                      ${newSellTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Overage:</span>
                    <span className={newOverageAmount !== currentOverage ? 'text-green-600 font-medium' : ''}>
                      ${newOverageAmount.toLocaleString()} ({newOveragePercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Commission:</span>
                    <span className={newCommission !== currentCommission ? 'text-blue-600 font-medium' : ''}>
                      ${newCommission.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Summary */}
            {(newSellTotal !== currentSellTotal || newOverageAmount !== currentOverage) && (
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--muted-foreground)]">Change:</span>
                  <span className={newOverageAmount > currentOverage ? 'text-green-600' : newOverageAmount < currentOverage ? 'text-red-600' : ''}>
                    {newOverageAmount >= currentOverage ? '+' : ''}${(newOverageAmount - currentOverage).toLocaleString()}
                    {' '}({newOverageAmount >= currentOverage ? '+' : ''}{(newOveragePercent - currentAvgOveragePercent).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(newOveragePercent);
              handleClose();
            }}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply to {unlockedCount} Line{unlockedCount !== 1 ? 's' : ''}
            {lockedCount > 0 && (
              <span className="ml-1 text-xs opacity-75">({lockedCount} locked)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
