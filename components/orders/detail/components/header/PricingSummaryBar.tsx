/**
 * PricingSummaryBar Component
 * Displays ship status and order totals
 */

'use client';

import React from 'react';
import { Order } from '@/lib/types/rms';
import { ViewMode } from '../../types';
import { formatCurrency } from '../../utils';
import { getOrderShipStatus } from '../../utils';

interface PricingSummaryBarProps {
  order: Order;
  viewMode: ViewMode;
  totals: {
    subtotal: number;
    freight: number;
    total: number;
    commission: number;
    totalOvg: number;
    totalEarn: number;
    originalSubtotal?: number;
    totalLineDiscount?: number;
    originalCommission?: number;
    totalCommissionDiscount?: number;
  };
}

export function PricingSummaryBar({ order, viewMode, totals }: PricingSummaryBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-r from-slate-50 to-indigo-50/50 flex-shrink-0 px-6 py-3 flex items-center justify-end">
      {/* Totals */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Subtotal</span>
          <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.subtotal)}</span>
          {(totals.totalLineDiscount || 0) > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 line-through">{formatCurrency(totals.originalSubtotal || 0)}</span>
              <span className="text-xs text-orange-600 bg-orange-50 px-1 rounded">-{formatCurrency(totals.totalLineDiscount || 0)}</span>
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Freight</span>
          <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.freight)}</span>
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
          {(totals.totalCommissionDiscount || 0) > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 line-through">{formatCurrency(totals.originalCommission || 0)}</span>
              <span className="text-xs text-purple-600 bg-purple-50 px-1 rounded">-{formatCurrency(totals.totalCommissionDiscount || 0)}</span>
            </div>
          )}
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
