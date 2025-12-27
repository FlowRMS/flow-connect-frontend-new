'use client';

import React from 'react';
import type { LineItem } from '../types';

type AutoCalcMode = 'overage' | 'commission';

interface AutoCalcOverageModalProps {
  show: boolean;
  quoteLineItems: LineItem[];
  autoCalcMode: AutoCalcMode;
  autoCalcTargetOverage: string;
  autoCalcTargetCommission: string;
  onClose: () => void;
  onSetAutoCalcMode: (mode: AutoCalcMode) => void;
  onSetAutoCalcTargetOverage: (value: string) => void;
  onSetAutoCalcTargetCommission: (value: string) => void;
  onApply: (targetOveragePercent: number) => void;
}

export function AutoCalcOverageModal({
  show,
  quoteLineItems,
  autoCalcMode,
  autoCalcTargetOverage,
  autoCalcTargetCommission,
  onClose,
  onSetAutoCalcMode,
  onSetAutoCalcTargetOverage,
  onSetAutoCalcTargetCommission,
  onApply,
}: AutoCalcOverageModalProps) {
  if (!show) return null;

  // Get eligible items (unlocked and overage-eligible)
  const allItems = quoteLineItems;
  const eligibleItems = allItems.filter(item => !item.locked && item.manufacturers[0].overageShare > 0);
  const lockedItems = allItems.filter(item => item.locked);
  const ineligibleItems = allItems.filter(item => !item.locked && item.manufacturers[0].overageShare === 0);

  // Current totals
  const currentBaseTotal = allItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const currentSellTotal = allItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const currentOverage = currentSellTotal - currentBaseTotal;
  const currentOveragePercent = currentBaseTotal > 0 ? (currentOverage / currentBaseTotal) * 100 : 0;

  // Current commission
  const currentCommission = allItems.reduce((sum, item) => {
    const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
    const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
    const overageComm = overageAmt * item.manufacturers[0].overageShare;
    return sum + baseComm + overageComm;
  }, 0);

  // Calculate fixed amounts (from locked and ineligible items)
  const fixedBaseTotal = [...lockedItems, ...ineligibleItems].reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const fixedSellTotal = [...lockedItems, ...ineligibleItems].reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const fixedCommission = [...lockedItems, ...ineligibleItems].reduce((sum, item) => {
    const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
    const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
    const overageComm = overageAmt * item.manufacturers[0].overageShare;
    return sum + baseComm + overageComm;
  }, 0);

  // Eligible items base total
  const eligibleBaseTotal = eligibleItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const eligibleBaseCommission = eligibleItems.reduce((sum, item) => sum + (item.basePrice * item.quantity * item.manufacturers[0].commissionRate), 0);

  // Calculate target values
  let targetOveragePercent = 0;
  let targetSellTotal = currentSellTotal;
  let targetCommission = currentCommission;

  if (autoCalcMode === 'overage' && autoCalcTargetOverage) {
    targetOveragePercent = parseFloat(autoCalcTargetOverage) || 0;
    // Apply target overage to eligible items
    const newEligibleSell = eligibleItems.reduce((sum, item) => {
      return sum + (item.basePrice * (1 + targetOveragePercent / 100) * item.quantity);
    }, 0);
    targetSellTotal = fixedSellTotal + newEligibleSell;
    // Recalculate commission
    targetCommission = fixedCommission + eligibleItems.reduce((sum, item) => {
      const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
      const newOverageAmt = item.basePrice * (targetOveragePercent / 100) * item.quantity;
      const overageComm = newOverageAmt * item.manufacturers[0].overageShare;
      return sum + baseComm + overageComm;
    }, 0);
  } else if (autoCalcMode === 'commission' && autoCalcTargetCommission) {
    targetCommission = parseFloat(autoCalcTargetCommission) || 0;
    // Calculate required overage to hit target commission
    // targetCommission = fixedCommission + eligibleBaseCommission + (eligibleOverageAmount * avgOverageShare)
    // Solve for overage amount, then overage %
    const requiredOverageCommission = targetCommission - fixedCommission - eligibleBaseCommission;
    const avgOverageShare = eligibleItems.length > 0
      ? eligibleItems.reduce((sum, item) => sum + item.manufacturers[0].overageShare, 0) / eligibleItems.length
      : 0.85;
    const requiredOverageAmount = avgOverageShare > 0 ? requiredOverageCommission / avgOverageShare : 0;
    targetOveragePercent = eligibleBaseTotal > 0 ? (requiredOverageAmount / eligibleBaseTotal) * 100 : 0;
    targetOveragePercent = Math.max(0, targetOveragePercent); // Can't be negative
    targetSellTotal = fixedSellTotal + eligibleBaseTotal * (1 + targetOveragePercent / 100);
  }

  const canApply = eligibleItems.length > 0 && (
    (autoCalcMode === 'overage' && autoCalcTargetOverage) ||
    (autoCalcMode === 'commission' && autoCalcTargetCommission)
  );

  const handleClose = () => {
    onSetAutoCalcTargetOverage('');
    onSetAutoCalcTargetCommission('');
    onClose();
  };

  const handleApply = () => {
    onApply(targetOveragePercent);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Auto-Calculate Overage</h2>
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
            Set a target overage percentage or total commission, and the system will adjust the overage on all eligible lines to achieve it.
          </p>

          {/* Mode Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => onSetAutoCalcMode('overage')}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                autoCalcMode === 'overage'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Target Overage %
            </button>
            <button
              onClick={() => onSetAutoCalcMode('commission')}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                autoCalcMode === 'commission'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Target Commission
            </button>
          </div>

          {/* Input */}
          {autoCalcMode === 'overage' ? (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Target Overage Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={autoCalcTargetOverage}
                  onChange={(e) => onSetAutoCalcTargetOverage(e.target.value)}
                  placeholder={currentOveragePercent.toFixed(1)}
                  className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                  autoFocus
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
                <span className="text-xs text-[var(--muted-foreground)]">(current: {currentOveragePercent.toFixed(1)}%)</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Target Total Commission
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={autoCalcTargetCommission}
                  onChange={(e) => onSetAutoCalcTargetCommission(e.target.value)}
                  placeholder={currentCommission.toFixed(0)}
                  className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                  autoFocus
                />
                <span className="text-xs text-[var(--muted-foreground)]">(current: ${currentCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
              </div>
            </div>
          )}

          {/* Line counts */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Total Lines:</span>
              <span className="text-[var(--foreground)]">{allItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Eligible (will be modified):</span>
              <span className="text-green-600 font-medium">{eligibleItems.length}</span>
            </div>
            {lockedItems.length > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Locked (won&apos;t change):</span>
                <span className="text-amber-600">{lockedItems.length}</span>
              </div>
            )}
            {ineligibleItems.length > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Overage Ineligible:</span>
                <span className="text-gray-500">{ineligibleItems.length}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {canApply && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Preview
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">New Overage %:</span>
                  <span className={`font-medium ${targetOveragePercent > currentOveragePercent ? 'text-green-600' : targetOveragePercent < currentOveragePercent ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                    {targetOveragePercent.toFixed(1)}%
                    <span className="text-xs ml-1">({targetOveragePercent >= currentOveragePercent ? '+' : ''}{(targetOveragePercent - currentOveragePercent).toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">New Sell Total:</span>
                  <span className={`font-medium ${targetSellTotal > currentSellTotal ? 'text-green-600' : targetSellTotal < currentSellTotal ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                    ${targetSellTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-xs ml-1">({targetSellTotal >= currentSellTotal ? '+' : ''}${(targetSellTotal - currentSellTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-[var(--foreground)] font-medium">New Commission:</span>
                  <span className={`font-semibold ${targetCommission > currentCommission ? 'text-green-600' : targetCommission < currentCommission ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                    ${targetCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-xs ml-1">({targetCommission >= currentCommission ? '+' : ''}${(targetCommission - currentCommission).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                  </span>
                </div>
              </div>
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
            disabled={!canApply || targetOveragePercent < 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply to {eligibleItems.length} Lines
          </button>
        </div>
      </div>
    </div>
  );
}
