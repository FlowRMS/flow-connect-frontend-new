/**
 * PricingSummaryBar Component
 * Shows totals summary for the statement
 */

'use client';

import React from 'react';

interface PricingSummaryBarProps {
  subtotal: number;
  total: number;
  commission: number;
  lineItemCount: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

export function PricingSummaryBar({
  subtotal,
  total,
  commission,
  lineItemCount,
}: PricingSummaryBarProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-[var(--border)] px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Line items count */}
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>{lineItemCount} line item{lineItemCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Right side - Totals */}
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Subtotal</p>
            <p className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
              {formatCurrency(subtotal)}
            </p>
          </div>

          <div className="h-8 w-px bg-[var(--border)]" />

          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-[var(--foreground)] tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>

          <div className="h-8 w-px bg-[var(--border)]" />

          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Commission</p>
            <p className="text-lg font-bold text-emerald-600 tabular-nums">
              {formatCurrency(commission)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
