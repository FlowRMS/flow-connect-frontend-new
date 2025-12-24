'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';

interface LineItemsTableProps {
  fulfillmentOrder: FulfillmentOrder;
}

export default function LineItemsTable({ fulfillmentOrder }: LineItemsTableProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Line Items</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200" title="These order lines are locked to this FO">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            FO Locked
          </span>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">{fulfillmentOrder.lineItems.length} items</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">UOM</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Ordered</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reserved</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Picked</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Shipped</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Backorder</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Pick Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {fulfillmentOrder.lineItems.map((lineItem) => (
            <tr key={lineItem.id} className="hover:bg-[var(--muted)]/20 transition-colors">
              <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{lineItem.partNumber}</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)]">{lineItem.productName}</td>
              <td className="px-4 py-2 text-sm text-[var(--muted-foreground)] text-center">{lineItem.uom}</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.orderedQty}</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.allocatedQty}</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">0</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.shippedQty}</td>
              <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.backorderQty}</td>
              <td className="px-4 py-2">
                <span className="text-sm text-[var(--muted-foreground)]">
                  {lineItem.pickLocation || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

