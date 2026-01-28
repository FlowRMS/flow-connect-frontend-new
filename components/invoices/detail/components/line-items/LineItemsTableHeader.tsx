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
  isPinned?: (colKey: ColumnKey) => boolean;
  getPinnedColumnStyle?: (colKey: ColumnKey, isHeader?: boolean) => React.CSSProperties;
}

export function LineItemsTableHeader({
  lineItems,
  selectedLineItems,
  onToggleAllLineItems,
  visibleColumns,
  viewMode,
  isPinned = () => false,
  getPinnedColumnStyle = () => ({}),
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
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('partNumber', true)}
          >
            <div className="flex items-center gap-1">
              Part #
              {isPinned('partNumber') ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
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
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('custPartNumber') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('custPartNumber', true)}
          >
            <div className="flex items-center gap-1">
              Cust Part #
              {isPinned('custPartNumber') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('description') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('description', true)}
          >
            <div className="flex items-center gap-1">
              Description
              {isPinned('description') ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
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
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('uom') && (
          <th
            className={`px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('uom') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('uom', true)}
          >
            <div className="flex items-center justify-center gap-1">
              UOM
              {isPinned('uom') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('divisor') && (
          <th
            className={`px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('divisor') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('divisor', true)}
          >
            <div className="flex items-center justify-center gap-1">
              Divisor
              {isPinned('divisor') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('unitPrice') && (
          <th
            className={`px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('unitPrice') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('unitPrice', true)}
          >
            <div className="flex items-center justify-end gap-1">
              Unit Price
              {isPinned('unitPrice') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('quantity') && (
          <th
            className={`px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('quantity') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('quantity', true)}
          >
            <div className="flex items-center justify-center gap-1">
              Qty
              {isPinned('quantity') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('sellTotal') && (
          <th
            className={`px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('sellTotal') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('sellTotal', true)}
          >
            <div className="flex items-center justify-end gap-1">
              Sell Total
              {isPinned('sellTotal') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
          <th
            className={`px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('commissionPercent') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('commissionPercent', true)}
          >
            <div className="flex items-center justify-end gap-1">
              Commission %
              {isPinned('commissionPercent') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('commission') && (
          <th
            className={`px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('commission') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('commission', true)}
          >
            <div className="flex items-center justify-end gap-1">
              Commission
              {isPinned('commission') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('commissionTotal') && (
          <th
            className={`px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)] ${isPinned('commissionTotal') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('commissionTotal', true)}
          >
            <div className="flex items-center justify-end gap-1">
              Commission Total
              {isPinned('commissionTotal') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
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
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)] ${isPinned('linkedOrder') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('linkedOrder', true)}
          >
            <div className="flex items-center gap-1">
              Order #
              {isPinned('linkedOrder') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {visibleColumns.has('linkedCheck') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)] ${isPinned('linkedCheck') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('linkedCheck', true)}
          >
            <div className="flex items-center gap-1">
              Check #
              {isPinned('linkedCheck') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {/* Actions column */}
        <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10 bg-[var(--card)]"></th>
      </tr>
    </thead>
  );
}

