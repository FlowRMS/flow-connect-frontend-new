/**
 * LineItemsTableRow Component
 * Single table row for a check line item with all columns
 */

'use client';

import React from 'react';
import type { LineItem, ColumnKey, CheckStatus } from '../../types';

interface LineItemsTableRowProps {
  item: LineItem;
  visibleColumns: Set<ColumnKey>;
  status: CheckStatus;
  onTogglePaid: (id: string) => void;
  onRowClick: (item: LineItem) => void;
}

export function LineItemsTableRow({
  item,
  visibleColumns,
  status,
  onTogglePaid,
  onRowClick,
}: LineItemsTableRowProps) {
  return (
    <tr
      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
      onClick={() => onRowClick(item)}
    >
      {visibleColumns.has('number') && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
              item.type === 'invoice'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : item.type === 'credit'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              {item.type === 'invoice' ? 'Invoice' : item.type === 'credit' ? 'Credit' : 'Adjustment'}
            </span>
            <span className="text-sm text-[var(--foreground)] font-medium">{item.number || '-'}</span>
          </div>
        </td>
      )}
      {visibleColumns.has('orderNumber') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
          {item.type === 'adjustment' ? (
            <span className="text-xs italic">N/A</span>
          ) : item.orderNumber ? (
            <span className="font-medium">{item.orderNumber}</span>
          ) : item.orderId ? (
            <span className="font-mono text-xs">{item.orderId.substring(0, 8)}...</span>
          ) : '-'}
        </td>
      )}
      {visibleColumns.has('customer') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          {item.customer}
        </td>
      )}
      {visibleColumns.has('salesRep') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          {item.salesRep}
        </td>
      )}
      {visibleColumns.has('commissionRate') && (
        <td className="px-4 py-3 text-sm opacity-50">
          <span className="text-[var(--muted-foreground)]">
            {item.commissionRateExpected.toFixed(3)}%
          </span>
          <span className="mx-1 text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            {item.commissionRateActual.toFixed(3)}%
          </span>
        </td>
      )}
      {visibleColumns.has('expectedCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          ${item.expectedCommission.toFixed(4)}
        </td>
      )}
      {visibleColumns.has('paidCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          ${item.paidCommission.toFixed(4)}
        </td>
      )}
      {visibleColumns.has('balance') && (
        <td className="px-4 py-3 text-sm opacity-50">
          <div className="flex items-center gap-2">
            {item.balance === 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className="text-gray-400"
              >
                <path
                  d="M5 10l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="text-[var(--muted-foreground)]">${item.balance.toFixed(4)}</span>
          </div>
        </td>
      )}
      {visibleColumns.has('paid') && (
        <td className="px-4 py-3 text-center opacity-50">
          {status === 'posted' ? (
            item.paid ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto text-gray-400"
              >
                <path
                  d="M5 10l3 3 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null
          ) : (
            <input
              type="checkbox"
              checked={item.paid}
              disabled
              className="w-4 h-4 accent-[var(--primary)] cursor-not-allowed"
            />
          )}
        </td>
      )}
    </tr>
  );
}

