'use client';

import React from 'react';
import { FulfillmentOrder, fulfillmentOrderStatusColors, fulfillmentOrderStatusLabels } from '@/lib/types/warehouse';

interface FulfillmentOrdersTableProps {
  orders: FulfillmentOrder[];
  onRowClick: (order: FulfillmentOrder) => void;
}

export default function FulfillmentOrdersTable({ orders, onRowClick }: FulfillmentOrdersTableProps) {
  const getTotalQty = (fo: FulfillmentOrder) => {
    return fo.lineItems.reduce((sum, li) => sum + li.orderedQty, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <h3 className="font-semibold text-[var(--foreground)]">Orders Awaiting Fulfillment</h3>
        <p className="text-sm text-[var(--muted-foreground)]">A list of orders with items marked as &quot;Released to Warehouse&quot;.</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Order #</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Qty</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                No fulfillment orders found
              </td>
            </tr>
          ) : (
            orders.map((fo) => (
              <tr
                key={fo.id}
                className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                onClick={() => onRowClick(fo)}
              >
                <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{fo.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fo.customerName}</td>
                <td className="px-6 py-4">
                  {fo.lineItems.length === 1 ? (
                    <>
                      <div className="text-sm text-[var(--foreground)]">{fo.lineItems[0].productName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{fo.lineItems[0].partNumber}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-[var(--foreground)]">{fo.lineItems.length} products</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{fo.lineItems[0].partNumber} + {fo.lineItems.length - 1} more</div>
                    </>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{getTotalQty(fo)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${fulfillmentOrderStatusColors[fo.status]}`}>
                    {fulfillmentOrderStatusLabels[fo.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(fo.createdAt)}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(fo);
                    }}
                    className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    Start Picking
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

