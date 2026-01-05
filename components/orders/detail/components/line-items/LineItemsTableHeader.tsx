/**
 * LineItemsTableHeader Component
 * Table header with all 28 columns
 */

'use client';

import React from 'react';
import type { OrderLineItem } from '@/lib/types/rms';
import type { ColumnKey, ViewMode } from '../../types';

interface LineItemsTableHeaderProps {
  lineItems: OrderLineItem[];
  selectedLineItems: Set<string>;
  onToggleAllLineItems: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  isPinned: (column: ColumnKey) => boolean;
  getPinnedColumnStyle: (column: ColumnKey) => React.CSSProperties;
}

export function LineItemsTableHeader({
  lineItems,
  selectedLineItems,
  onToggleAllLineItems,
  visibleColumns,
  viewMode,
  isPinned,
  getPinnedColumnStyle,
}: LineItemsTableHeaderProps) {
  const allSelected = lineItems.length > 0 && lineItems.every(item => selectedLineItems.has(item.id));

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

        {/* Indicator column for acknowledgements and credits */}
        {(visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) && (
          <th className="px-1 py-2 bg-[var(--card)]">
            <div className="flex items-center gap-1">
              {visibleColumns.has('iconAcknowledgement') && <div className="w-7"></div>}
              {visibleColumns.has('iconDocumentSpecific') && <div className="w-7"></div>}
              {visibleColumns.has('iconWarehouse') && <div className="w-7"></div>}
              {visibleColumns.has('iconCredit') && <div className="w-7"></div>}
            </div>
          </th>
        )}

        {/* Part Number */}
        {visibleColumns.has('partNumber') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('partNumber')}
          >
            <div className="flex items-center gap-1">
              Part #
              {isPinned('partNumber') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {/* Customer Part Number */}
        {visibleColumns.has('custPartNumber') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('custPartNumber')}
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

        {/* Description */}
        {visibleColumns.has('description') && (
          <th
            className={`px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            style={getPinnedColumnStyle('description')}
          >
            <div className="flex items-center gap-1">
              Description
              {isPinned('description') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6a1 1 0 00-1-1h-4a1 1 0 00-1 1v4.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </th>
        )}

        {/* UOM */}
        {visibleColumns.has('uom') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            UOM
          </th>
        )}

        {/* Divisor */}
        {visibleColumns.has('divisor') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Divisor
          </th>
        )}

        {/* Unit Price */}
        {visibleColumns.has('unitPrice') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Unit Price
          </th>
        )}

        {/* Quantity */}
        {visibleColumns.has('quantity') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Qty
          </th>
        )}

        {/* Shipped Qty */}
        {visibleColumns.has('shippedQty') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Shipped Qty
          </th>
        )}

        {/* Status */}
        {visibleColumns.has('lineStatus') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Status
          </th>
        )}

        {/* Sell Total */}
        {visibleColumns.has('sellTotal') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Sell Total
          </th>
        )}

        {/* Commission % (simple view) */}
        {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission %
          </th>
        )}

        {/* Commission */}
        {visibleColumns.has('commission') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission
          </th>
        )}

        {/* Commission Total */}
        {visibleColumns.has('commissionTotal') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Commission Total
          </th>
        )}

        {/* Quote # */}
        {visibleColumns.has('linkedQuote') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Quote #
          </th>
        )}

        {/* Invoice # */}
        {visibleColumns.has('linkedInvoice') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Invoice #
          </th>
        )}

        {/* Check # */}
        {visibleColumns.has('linkedCheck') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Check #
          </th>
        )}

        {/* Fulfillment # */}
        {visibleColumns.has('linkedFulfillment') && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap min-w-[120px] bg-[var(--card)]">
            Fulfillment #
          </th>
        )}

        {/* Invoiced */}
        {visibleColumns.has('invoiced') && (
          <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Invoiced
          </th>
        )}

        {/* % Over */}
        {visibleColumns.has('percentOver') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            % Over
          </th>
        )}

        {/* Com % (overage view) */}
        {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Com %
          </th>
        )}

        {/* Com $ */}
        {visibleColumns.has('commissionAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Com $
          </th>
        )}

        {/* Ovg % */}
        {visibleColumns.has('ovgPercent') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Ovg %
          </th>
        )}

        {/* Ovg $ */}
        {visibleColumns.has('ovgAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Ovg $
          </th>
        )}

        {/* Earn % */}
        {visibleColumns.has('earnPercent') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Earn %
          </th>
        )}

        {/* Earn $ */}
        {visibleColumns.has('earnAmount') && (
          <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap bg-[var(--card)]">
            Earn $
          </th>
        )}

        {/* Actions column */}
        <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10 bg-[var(--card)]"></th>
      </tr>
    </thead>
  );
}
