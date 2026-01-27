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
    <div className="border-b border-[var(--border)] bg-gradient-to-r from-slate-50 to-indigo-50/50 flex-shrink-0 px-6 py-3 flex items-center justify-end">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Subtotal</span>
          <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Total</span>
          <span className="font-bold text-lg text-[var(--foreground)]">{formatCurrency(totals.total)}</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-purple-500">Commission</span>
          <span className="font-bold text-lg text-purple-600">{formatCurrency(totals.commission)}</span>
        </div>
        {viewMode === 'overage' && (
          <>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-orange-500">Overage</span>
              <span className="font-semibold text-orange-500">{formatCurrency(totals.totalOvg)}</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-green-600">Total Earn</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(totals.totalEarn)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

