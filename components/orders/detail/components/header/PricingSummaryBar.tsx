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
  };
}

export function PricingSummaryBar({ order, viewMode, totals }: PricingSummaryBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-between">
      {/* Shipping Status */}
      <div className="flex items-center gap-2">
        {order && (() => {
          const shipStatus = getOrderShipStatus(order.lineItems || []);
          return (
            <>
              <span className="text-xs text-[var(--muted-foreground)]">Ship Status:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${shipStatus.color}`}>
                {shipStatus.label}
              </span>
            </>
          );
        })()}
      </div>
      {/* Totals */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[var(--muted-foreground)]">
          Subtotal: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.subtotal)}</span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Freight: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.freight)}</span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Total: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.total)}</span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Commission: <span className="font-medium text-purple-600">{formatCurrency(totals.commission)}</span>
        </span>
        {viewMode === 'overage' && (
          <>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Ovg $: <span className="font-medium text-orange-500">{formatCurrency(totals.totalOvg)}</span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Earn $: <span className="font-semibold text-green-600">{formatCurrency(totals.totalEarn)}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
