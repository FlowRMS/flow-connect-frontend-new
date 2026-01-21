/**
 * LineItemsTableHeader Component
 * Table header with all check line item columns - supports sorting
 */

'use client';

import React from 'react';
import type { ColumnKey, CheckStatus } from '../../types';
import type { SortableColumnKey, SortDirection } from './LineItemsTable';
import { COLUMN_LABELS } from '../../constants';

interface LineItemsTableHeaderProps {
  visibleColumns: Set<ColumnKey>;
  commissionSource: 'invoice' | 'order';
  sortColumn: SortableColumnKey;
  sortDirection: SortDirection;
  onSort: (column: SortableColumnKey) => void;
  status: CheckStatus;
  showActionsColumn?: boolean;
}

// Sort indicator component
function SortIndicator({ column, sortColumn, sortDirection }: { column: SortableColumnKey; sortColumn: SortableColumnKey; sortDirection: SortDirection }) {
  const isActive = column === sortColumn;
  return (
    <span className={`ml-1 inline-flex ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] opacity-0 group-hover:opacity-50'}`}>
      {isActive && sortDirection === 'asc' ? '↑' : isActive && sortDirection === 'desc' ? '↓' : '↕'}
    </span>
  );
}

export function LineItemsTableHeader({
  visibleColumns,
  commissionSource,
  sortColumn,
  sortDirection,
  onSort,
  status,
  showActionsColumn,
}: LineItemsTableHeaderProps) {
  const headerClass = "px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted)] transition-colors group select-none";

  return (
    <thead className="bg-[var(--card)] sticky top-0 z-20">
      <tr className="border-b border-[var(--border)]">
        {visibleColumns.has('number') && (
          <th className={headerClass} onClick={() => onSort('number')}>
            <span className="flex items-center">
              Number
              <SortIndicator column="number" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('orderNumber') && (
          <th className={headerClass} onClick={() => onSort('orderNumber')}>
            <span className="flex items-center">
              Order Number
              <SortIndicator column="orderNumber" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('customer') && (
          <th className={headerClass} onClick={() => onSort('customer')}>
            <span className="flex items-center">
              Customer
              <SortIndicator column="customer" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('salesRep') && (
          <th className={headerClass} onClick={() => onSort('salesRep')}>
            <span className="flex items-center">
              Sales Rep
              <SortIndicator column="salesRep" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('commissionRate') && (
          <th className={headerClass} onClick={() => onSort('commissionRate')}>
            <span className="flex items-center">
              Commission Rate
              <SortIndicator column="commissionRate" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('expectedCommission') && (
          <th className={headerClass} onClick={() => onSort('expectedCommission')}>
            <span className="flex items-center">
              <span className="relative inline-block group/tooltip">
                <span className="cursor-help border-b border-dashed border-[var(--muted-foreground)]">
                  Expected Commission
                </span>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] pointer-events-none">
                  Totaled from {commissionSource === 'invoice' ? 'Invoices' : 'Orders'}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></span>
                </span>
              </span>
              <SortIndicator column="expectedCommission" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('paidCommission') && (
          <th className={headerClass} onClick={() => onSort('paidCommission')}>
            <span className="flex items-center">
              {COLUMN_LABELS.paidCommission}
              <SortIndicator column="paidCommission" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('balance') && (
          <th className={headerClass} onClick={() => onSort('balance')}>
            <span className="flex items-center">
              Balance
              <SortIndicator column="balance" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('paid') && (
          <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
            {COLUMN_LABELS.paid}
          </th>
        )}
        {/* Actions column header (only when not posted) */}
        {status !== 'posted' && showActionsColumn && (
          <th className="px-2 py-3 text-center text-sm font-medium text-[var(--foreground)] w-12">
            {/* Empty header for actions column */}
          </th>
        )}
      </tr>
    </thead>
  );
}

