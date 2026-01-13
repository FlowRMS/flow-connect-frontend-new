/**
 * LineItemsTableHeader Component
 * Table header with all check line item columns
 */

'use client';

import React from 'react';
import type { ColumnKey } from '../../types';
import { COLUMN_LABELS } from '../../constants';

interface LineItemsTableHeaderProps {
  visibleColumns: Set<ColumnKey>;
  commissionSource: 'invoice' | 'order';
}

export function LineItemsTableHeader({
  visibleColumns,
  commissionSource,
}: LineItemsTableHeaderProps) {
  return (
    <thead className="bg-[var(--card)] sticky top-0 z-20">
      <tr className="border-b border-[var(--border)]">
        {visibleColumns.has('number') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Number
          </th>
        )}
        {visibleColumns.has('orderNumber') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Order Number
          </th>
        )}
        {visibleColumns.has('customer') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Customer
          </th>
        )}
        {visibleColumns.has('salesRep') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Sales Rep
          </th>
        )}
        {visibleColumns.has('commissionRate') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Commission Rate
          </th>
        )}
        {visibleColumns.has('expectedCommission') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            <div className="relative inline-block group">
              <span className="cursor-help border-b border-dashed border-[var(--muted-foreground)]">
                Expected Commission
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                Totaled from {commissionSource === 'invoice' ? 'Invoices' : 'Orders'}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </th>
        )}
        {visibleColumns.has('paidCommission') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            {COLUMN_LABELS.paidCommission}
          </th>
        )}
        {visibleColumns.has('balance') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            Balance
          </th>
        )}
        {visibleColumns.has('paid') && (
          <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
            {COLUMN_LABELS.paid}
          </th>
        )}
      </tr>
    </thead>
  );
}

