/**
 * LineItemsTableHeader Component
 * Table header with all invoice line item columns
 */

'use client';

import React from 'react';
import type { ColumnKey, ViewMode, InvoiceLineItem } from '../../types';

interface LineItemsTableHeaderProps {
  lineItems: InvoiceLineItem[];
  selectedLineItems: Set<string>;
  onToggleAllLineItems: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
}

export function LineItemsTableHeader({
  lineItems,
  selectedLineItems,
  onToggleAllLineItems,
  visibleColumns,
  viewMode,
}: LineItemsTableHeaderProps) {
  const allSelected =
    lineItems.length > 0 &&
    lineItems.every((item) => selectedLineItems.has(item.id));

  return (
    <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
      <tr>
        {/* Checkbox column */}
        <th className="w-10 px-3 py-2 text-left bg-[var(--card)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAllLineItems}
            className="accent-[var(--primary)]"
          />
        </th>

        {/* Dynamic columns */}
        {visibleColumns.has('partNumber') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            <div className="flex items-center gap-1">
              Part #
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--muted-foreground)]/50"
              >
                <path d="M8 6l4 4-4 4" />
              </svg>
            </div>
          </th>
        )}

        {visibleColumns.has('custPartNumber') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Cust Part #
          </th>
        )}

        {visibleColumns.has('description') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            <div className="flex items-center gap-1">
              Description
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--muted-foreground)]/50"
              >
                <path d="M8 6l4 4-4 4" />
              </svg>
            </div>
          </th>
        )}

        {visibleColumns.has('uom') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            UOM
          </th>
        )}

        {visibleColumns.has('divisor') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Divisor
          </th>
        )}

        {visibleColumns.has('unitPrice') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Unit Price
          </th>
        )}

        {visibleColumns.has('quantity') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Qty
          </th>
        )}

        {visibleColumns.has('sellTotal') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Sell Total
          </th>
        )}

        {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission %
          </th>
        )}

        {visibleColumns.has('commission') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission
          </th>
        )}

        {visibleColumns.has('commissionTotal') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission Total
          </th>
        )}

        {visibleColumns.has('percentOver') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            % Over
          </th>
        )}

        {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Com %
          </th>
        )}

        {visibleColumns.has('commissionAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Com $
          </th>
        )}

        {visibleColumns.has('ovgPercent') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Ovg %
          </th>
        )}

        {visibleColumns.has('ovgAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Ovg $
          </th>
        )}

        {visibleColumns.has('earnPercent') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Earn %
          </th>
        )}

        {visibleColumns.has('earnAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Earn $
          </th>
        )}

        {visibleColumns.has('linkedOrder') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Order #
          </th>
        )}

        {visibleColumns.has('linkedCheck') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Check #
          </th>
        )}

        {/* Actions column */}
        <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10 bg-[var(--card)]"></th>
      </tr>
    </thead>
  );
}

