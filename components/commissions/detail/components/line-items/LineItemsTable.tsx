/**
 * LineItemsTable Component
 * Main table component for check line items
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { LineItem, ColumnKey, CheckStatus } from '../../types';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';

// Sortable column keys
export type SortableColumnKey = 'number' | 'orderNumber' | 'customer' | 'salesRep' | 'commissionRate' | 'expectedCommission' | 'paidCommission' | 'balance' | 'entityDate';
export type SortDirection = 'asc' | 'desc';

interface LineItemsTableProps {
  lineItems: LineItem[];
  visibleColumns: Set<ColumnKey>;
  commissionSource: 'invoice' | 'order';
  status: CheckStatus;
  onTogglePaid: (id: string) => void;
  onAddNewLine: () => void;
  onRowClick: (item: LineItem) => void;
  onUpdateStatedCommission?: (id: string, amount: number) => void;
  onOrderClick?: (orderId: string) => void;
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
  onOrderClick,
}: LineItemsTableProps) {
  // Sort state - default to entityDate ascending (earliest invoice first)
  const [sortColumn, setSortColumn] = useState<SortableColumnKey>('entityDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle column header click for sorting
  const handleSort = (column: SortableColumnKey) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort line items
  const sortedLineItems = useMemo(() => {
    const sorted = [...lineItems].sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortColumn) {
        case 'number':
          aValue = a.number?.toLowerCase() || '';
          bValue = b.number?.toLowerCase() || '';
          break;
        case 'orderNumber':
          aValue = a.orderNumber?.toLowerCase() || '';
          bValue = b.orderNumber?.toLowerCase() || '';
          break;
        case 'customer':
          aValue = a.customer?.toLowerCase() || '';
          bValue = b.customer?.toLowerCase() || '';
          break;
        case 'salesRep':
          aValue = a.salesRep?.toLowerCase() || '';
          bValue = b.salesRep?.toLowerCase() || '';
          break;
        case 'commissionRate':
          aValue = a.commissionRateExpected || 0;
          bValue = b.commissionRateExpected || 0;
          break;
        case 'expectedCommission':
          aValue = a.expectedCommission || 0;
          bValue = b.expectedCommission || 0;
          break;
        case 'paidCommission':
          aValue = a.paidCommission || 0;
          bValue = b.paidCommission || 0;
          break;
        case 'balance':
          aValue = a.balance || 0;
          bValue = b.balance || 0;
          break;
        case 'entityDate':
          // Sort by entity date (invoice date)
          aValue = a.entityDate || a.createdAt || '';
          bValue = b.entityDate || b.createdAt || '';
          break;
        default:
          return 0;
      }

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return sorted;
  }, [lineItems, sortColumn, sortDirection]);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] flex flex-col h-full">
      {/* Add Line Button - at the top */}
      <div className="border-b border-[var(--border)] flex-shrink-0">
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

      {/* Scrollable table container - both horizontal and vertical scroll */}
      <div className="flex-1 overflow-auto min-h-0 max-h-[60vh] scrollbar-always-visible">
        <table className="w-full min-w-[1400px]">
          <LineItemsTableHeader
            visibleColumns={visibleColumns}
            commissionSource={commissionSource}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <tbody>
            {sortedLineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.size}
                  className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No line items. Click "Add Line" to add an invoice or credit.
                </td>
              </tr>
            ) : (
              sortedLineItems.map((item) => (
                <LineItemsTableRow
                  key={item.id}
                  item={item}
                  visibleColumns={visibleColumns}
                  status={status}
                  onTogglePaid={onTogglePaid}
                  onRowClick={onRowClick}
                  onUpdateStatedCommission={onUpdateStatedCommission}
                  onOrderClick={onOrderClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

