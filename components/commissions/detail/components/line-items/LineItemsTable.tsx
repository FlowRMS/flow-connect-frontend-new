/**
 * LineItemsTable Component
 * Main table component for check line items
 */

'use client';

import React from 'react';
import type { LineItem, ColumnKey, CheckStatus } from '../../types';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';

interface LineItemsTableProps {
  lineItems: LineItem[];
  visibleColumns: Set<ColumnKey>;
  commissionSource: 'invoice' | 'order';
  status: CheckStatus;
  onTogglePaid: (id: string) => void;
  onAddNewLine: () => void;
  onRowClick: (item: LineItem) => void;
  onUpdateStatedCommission?: (id: string, amount: number) => void;
}

export function LineItemsTable({
  lineItems,
  visibleColumns,
  commissionSource,
  status,
  onTogglePaid,
  onAddNewLine,
  onRowClick,
  onUpdateStatedCommission,
}: LineItemsTableProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] flex flex-col h-full">
      {/* Scrollable table container - both horizontal and vertical scroll */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full min-w-[1400px]">
          <LineItemsTableHeader
            visibleColumns={visibleColumns}
            commissionSource={commissionSource}
          />
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.size}
                  className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No line items. Click "Add Line" to add an invoice or credit.
                </td>
              </tr>
            ) : (
              lineItems.map((item) => (
                <LineItemsTableRow
                  key={item.id}
                  item={item}
                  visibleColumns={visibleColumns}
                  status={status}
                  onTogglePaid={onTogglePaid}
                  onRowClick={onRowClick}
                  onUpdateStatedCommission={onUpdateStatedCommission}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Line Button - always visible at bottom */}
      <div className="border-t border-[var(--border)] flex-shrink-0">
        <button
          onClick={onAddNewLine}
          className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 6v8M6 10h8" strokeLinecap="round" />
          </svg>
          Add Line
        </button>
      </div>
    </div>
  );
}

