/**
 * PricingSummaryBar Component
 * Displays invoice totals summary
 */

import React from 'react';
import type { ViewMode } from '../../types';
import { formatCurrency } from '../../utils';

interface PricingSummaryBarProps {
  viewMode: ViewMode;
  totals: {
    subtotal: number;
    freight: number;
    total: number;
    commission: number;
    amountPaid: number;
    balance: number;
    totalOvg: number;
    totalEarn: number;
  };
}

export function PricingSummaryBar({ viewMode, totals }: PricingSummaryBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[var(--muted-foreground)]">
          Subtotal:{' '}
          <span className="font-medium text-[var(--foreground)]">
            {formatCurrency(totals.subtotal)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Freight:{' '}
          <span className="font-medium text-[var(--foreground)]">
            {formatCurrency(totals.freight)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Total:{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {formatCurrency(totals.total)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Paid:{' '}
          <span className="font-medium text-green-600">
            {formatCurrency(totals.amountPaid)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Balance:{' '}
          <span
            className={`font-semibold ${
              totals.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'
            }`}
          >
            {formatCurrency(totals.balance)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Commission:{' '}
          <span className="font-medium text-purple-600">
            {formatCurrency(totals.commission)}
          </span>
        </span>
        {viewMode === 'overage' && (
          <>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Ovg $:{' '}
              <span className="font-medium text-orange-500">
                {formatCurrency(totals.totalOvg)}
              </span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Earn $:{' '}
              <span className="font-semibold text-green-600">
                {formatCurrency(totals.totalEarn)}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

