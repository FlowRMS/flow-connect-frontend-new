/**
 * LineItemsTable Component
 * Main line items table with all columns, rows, and bulk actions
 */

'use client';

import React from 'react';
import type { Invoice, Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode, LineItemCredit } from '../../types';
import { BulkActionsBar } from './BulkActionsBar';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';
import { formatCurrency } from '../../utils';

interface LineItemsTableProps {
  invoice: Invoice;
  selectedLineItems: Set<string>;
  onToggleLineItemSelection: (id: string) => void;
  onToggleAllLineItems: () => void;
  onClearSelection: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  lineItemCredits: Record<string, LineItemCredit>;
  onConvertToWarehouse: () => void;
  onShowOrderTooltip: (x: number, y: number, orders: Order[]) => void;
  mockOrders: Order[];
  mockChecks: any[];
}

export function LineItemsTable({
  invoice,
  selectedLineItems,
  onToggleLineItemSelection,
  onToggleAllLineItems,
  onClearSelection,
  visibleColumns,
  viewMode,
  lineItemCredits,
  onConvertToWarehouse,
  onShowOrderTooltip,
  mockOrders,
  mockChecks,
}: LineItemsTableProps) {
  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onConvertToWarehouse={onConvertToWarehouse}
        />
      )}

      {/* Line Items Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <LineItemsTableHeader
            lineItems={invoice.lineItems}
            selectedLineItems={selectedLineItems}
            onToggleAllLineItems={onToggleAllLineItems}
            visibleColumns={visibleColumns}
            viewMode={viewMode}
          />

          <tbody>
            {/* Show "Unknown line items" placeholder if invoice has no line items */}
            {invoice.lineItems.length === 0 ? (
              <tr className="border-b border-[var(--border)] bg-amber-50/50">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled
                    className="accent-[var(--primary)] opacity-50"
                  />
                </td>
                {visibleColumns.has('partNumber') && (
                  <td className="px-3 py-2 text-sm">
                    <span className="text-amber-700 italic">Unknown</span>
                  </td>
                )}
                {visibleColumns.has('description') && (
                  <td className="px-3 py-2 text-sm max-w-[200px]">
                    <span className="text-amber-700 italic">
                      Unknown line items
                    </span>
                  </td>
                )}
                {visibleColumns.has('sellTotal') && (
                  <td className="px-3 py-2 text-sm text-right font-medium">
                    {formatCurrency(invoice.total)}
                  </td>
                )}
                {visibleColumns.has('commission') && (
                  <td className="px-3 py-2 text-sm text-right text-purple-600">
                    {formatCurrency(invoice.totalCommission)}
                  </td>
                )}
                <td colSpan={100}></td>
              </tr>
            ) : (
              invoice.lineItems.map((item) => (
                <LineItemsTableRow
                  key={item.id}
                  item={item}
                  invoice={invoice}
                  isSelected={selectedLineItems.has(item.id)}
                  onToggleSelection={onToggleLineItemSelection}
                  visibleColumns={visibleColumns}
                  viewMode={viewMode}
                  lineItemCredits={lineItemCredits}
                  onShowOrderTooltip={onShowOrderTooltip}
                  mockOrders={mockOrders}
                  mockChecks={mockChecks}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Add Line Button */}
        <div className="border-t border-[var(--border)]">
          <button className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
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
    </div>
  );
}

