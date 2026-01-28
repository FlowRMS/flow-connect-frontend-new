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
  isPinned?: (colKey: ColumnKey) => boolean;
  getPinnedColumnStyle?: (colKey: ColumnKey, isHeader?: boolean) => React.CSSProperties;
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
  isPinned = () => false,
  getPinnedColumnStyle = () => ({}),
}: LineItemsTableHeaderProps) {
  const headerClass = "px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted)] transition-colors group select-none";

  return (
    <thead className="bg-[var(--card)] sticky top-0 z-20">
      <tr className="border-b border-[var(--border)]">
        {visibleColumns.has('number') && (
          <th
            className={`${headerClass} ${isPinned('number') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('number')}
            style={getPinnedColumnStyle('number', true)}
          >
            <span className="flex items-center">
              Number
              {isPinned('number') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="number" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('orderNumber') && (
          <th
            className={`${headerClass} ${isPinned('orderNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('orderNumber')}
            style={getPinnedColumnStyle('orderNumber', true)}
          >
            <span className="flex items-center">
              Order Number
              {isPinned('orderNumber') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="orderNumber" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('customer') && (
          <th
            className={`${headerClass} ${isPinned('customer') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('customer')}
            style={getPinnedColumnStyle('customer', true)}
          >
            <span className="flex items-center">
              Customer
              {isPinned('customer') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="customer" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('salesRep') && (
          <th
            className={`${headerClass} ${isPinned('salesRep') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('salesRep')}
            style={getPinnedColumnStyle('salesRep', true)}
          >
            <span className="flex items-center">
              Sales Rep
              {isPinned('salesRep') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="salesRep" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('commissionRate') && (
          <th
            className={`${headerClass} ${isPinned('commissionRate') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('commissionRate')}
            style={getPinnedColumnStyle('commissionRate', true)}
          >
            <span className="flex items-center">
              Commission Rate
              {isPinned('commissionRate') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="commissionRate" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('expectedCommission') && (
          <th
            className={`${headerClass} ${isPinned('expectedCommission') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('expectedCommission')}
            style={getPinnedColumnStyle('expectedCommission', true)}
          >
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
              {isPinned('expectedCommission') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="expectedCommission" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('paidCommission') && (
          <th
            className={`${headerClass} ${isPinned('paidCommission') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('paidCommission')}
            style={getPinnedColumnStyle('paidCommission', true)}
          >
            <span className="flex items-center">
              {COLUMN_LABELS.paidCommission}
              {isPinned('paidCommission') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="paidCommission" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('balance') && (
          <th
            className={`${headerClass} ${isPinned('balance') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            onClick={() => onSort('balance')}
            style={getPinnedColumnStyle('balance', true)}
          >
            <span className="flex items-center">
              Balance
              {isPinned('balance') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 ml-1">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <SortIndicator column="balance" sortColumn={sortColumn} sortDirection={sortDirection} />
            </span>
          </th>
        )}
        {visibleColumns.has('paid') && (
          <th
            className={`px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] ${isPinned('paid') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('paid', true)}
          >
            <div className="flex items-center justify-center gap-1">
              {COLUMN_LABELS.paid}
              {isPinned('paid') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
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

