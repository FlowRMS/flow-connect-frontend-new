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
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">Customer</span>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
            </div>
          </th>
        )}
        {visibleColumns.has('salesRep') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">Sales Rep</span>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
            </div>
          </th>
        )}
        {visibleColumns.has('commissionRate') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">Commission Rate</span>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
            </div>
          </th>
        )}
        {visibleColumns.has('expectedCommission') && (
          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
            <div className="flex items-center gap-1.5">
              <div className="relative inline-block group opacity-50">
                <span className="cursor-help border-b border-dashed border-[var(--muted-foreground)]">
                  Expected Commission
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                  Totaled from {commissionSource === 'invoice' ? 'Invoices' : 'Orders'}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
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
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">Balance</span>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
            </div>
          </th>
        )}
        {visibleColumns.has('paid') && (
          <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
            <div className="flex items-center justify-center gap-1.5">
              <span className="opacity-50">{COLUMN_LABELS.paid}</span>
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
            </div>
          </th>
        )}
      </tr>
    </thead>
  );
}

