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
}

export function LineItemsTableRow({
  item,
  visibleColumns,
  status,
  onTogglePaid,
}: LineItemsTableRowProps) {
  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors">
      {visibleColumns.has('number') && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 border border-blue-200">
              {item.type === 'invoice' ? 'Invoice' : 'Credit'}
            </span>
            <span className="text-sm text-[var(--foreground)]">{item.number}</span>
          </div>
        </td>
      )}
      {visibleColumns.has('orderNumber') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          {item.orderNumber}
        </td>
      )}
      {visibleColumns.has('customer') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          {item.customer}
        </td>
      )}
      {visibleColumns.has('salesRep') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          {item.salesRep}
        </td>
      )}
      {visibleColumns.has('commissionRate') && (
        <td className="px-4 py-3 text-sm">
          <span className="text-[var(--foreground)]">
            {item.commissionRateExpected.toFixed(3)}%
          </span>
          <span className="mx-1 text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--primary)]">
            {item.commissionRateActual.toFixed(3)}%
          </span>
        </td>
      )}
      {visibleColumns.has('expectedCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          ${item.expectedCommission.toFixed(4)}
        </td>
      )}
      {visibleColumns.has('paidCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          ${item.paidCommission.toFixed(4)}
        </td>
      )}
      {visibleColumns.has('balance') && (
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            {item.balance === 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className="text-green-500"
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
            <span className="text-green-600">${item.balance.toFixed(4)}</span>
          </div>
        </td>
      )}
      {visibleColumns.has('paid') && (
        <td className="px-4 py-3 text-center">
          {status === 'posted' ? (
            item.paid ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto text-green-600"
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
              onChange={() => onTogglePaid(item.id)}
              className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
            />
          )}
        </td>
      )}
    </tr>
  );
}

