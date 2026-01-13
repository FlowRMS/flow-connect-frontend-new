/**
 * LineItemsTableRow Component
 * Single table row for a check line item with all columns
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { LineItem, ColumnKey, CheckStatus } from '../../types';

interface LineItemsTableRowProps {
  item: LineItem;
  visibleColumns: Set<ColumnKey>;
  status: CheckStatus;
  onTogglePaid: (id: string) => void;
  onRowClick: (item: LineItem) => void;
  onUpdateStatedCommission?: (id: string, amount: number) => void;
  onOrderClick?: (orderId: string) => void;
}

export function LineItemsTableRow({
  item,
  visibleColumns,
  status,
  onTogglePaid,
  onRowClick,
  onUpdateStatedCommission,
  onOrderClick,
}: LineItemsTableRowProps) {
  const [statedCommission, setStatedCommission] = useState(item.paidCommission.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when prop changes (e.g., updated from modal)
  useEffect(() => {
    setStatedCommission(item.paidCommission.toString());
  }, [item.paidCommission]);

  const handleStatedCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatedCommission(e.target.value);
  };

  const handleStatedCommissionBlur = () => {
    const newAmount = parseFloat(statedCommission) || 0;
    if (newAmount !== item.paidCommission && onUpdateStatedCommission) {
      onUpdateStatedCommission(item.id, newAmount);
    }
  };

  const handleStatedCommissionFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus to allow quick value entry
    e.target.select();
  };

  const handleStatedCommissionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleStatedCommissionClick = (e: React.MouseEvent) => {
    // Prevent row click when clicking on the input
    e.stopPropagation();
  };
  return (
    <tr
      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
      onClick={() => onRowClick(item)}
    >
      {visibleColumns.has('number') && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
              item.type === 'invoice'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : item.type === 'credit'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              {item.type === 'invoice' ? 'Invoice' : item.type === 'credit' ? 'Credit' : 'Adjustment'}
            </span>
            <span className="text-sm text-[var(--foreground)] font-medium">{item.number || '-'}</span>
            {item.isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700 border border-emerald-300 uppercase tracking-wide animate-pulse">
                New
              </span>
            )}
          </div>
        </td>
      )}
      {visibleColumns.has('orderNumber') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
          {item.type === 'adjustment' ? (
            <span className="text-xs italic">N/A</span>
          ) : item.orderNumber ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOrderClick && item.orderId) {
                  onOrderClick(item.orderId);
                }
              }}
              className="font-medium text-[var(--primary)] hover:underline focus:outline-none focus:underline"
            >
              {item.orderNumber}
            </button>
          ) : item.orderId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOrderClick) {
                  onOrderClick(item.orderId);
                }
              }}
              className="font-mono text-xs text-[var(--primary)] hover:underline focus:outline-none focus:underline"
            >
              {item.orderId.substring(0, 8)}...
            </button>
          ) : '-'}
        </td>
      )}
      {visibleColumns.has('customer') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          {item.customer}
        </td>
      )}
      {visibleColumns.has('salesRep') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          {item.salesRep}
        </td>
      )}
      {visibleColumns.has('commissionRate') && (
        <td className="px-4 py-3 text-sm opacity-50">
          <span className="text-[var(--muted-foreground)]">
            {Number(item.commissionRateExpected).toFixed(3)}%
          </span>
          <span className="mx-1 text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            {Number(item.commissionRateActual).toFixed(3)}%
          </span>
        </td>
      )}
      {visibleColumns.has('expectedCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-50">
          ${Number(item.expectedCommission).toFixed(4)}
        </td>
      )}
      {visibleColumns.has('paidCommission') && (
        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
          {status === 'posted' ? (
            <span>${Number(item.paidCommission).toFixed(4)}</span>
          ) : (
            <div className="flex items-center" onClick={handleStatedCommissionClick}>
              <span className="text-[var(--muted-foreground)] mr-1">$</span>
              <input
                ref={inputRef}
                type="number"
                step="0.0001"
                value={statedCommission}
                onChange={handleStatedCommissionChange}
                onBlur={handleStatedCommissionBlur}
                onFocus={handleStatedCommissionFocus}
                onKeyDown={handleStatedCommissionKeyDown}
                className="w-24 px-2 py-1 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
          )}
        </td>
      )}
      {visibleColumns.has('balance') && (
        <td className="px-4 py-3 text-sm opacity-50">
          <div className="flex items-center gap-2">
            {item.balance === 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className="text-gray-400"
              >
                <path
                  d="M5 10l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="text-[var(--muted-foreground)]">${Number(item.balance).toFixed(4)}</span>
          </div>
        </td>
      )}
      {visibleColumns.has('paid') && (
        <td className="px-4 py-3 text-center opacity-50">
          {status === 'posted' ? (
            item.paid ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto text-gray-400"
              >
                <path
                  d="M5 10l3 3 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null
          ) : (
            <input
              type="checkbox"
              checked={item.paid}
              disabled
              className="w-4 h-4 accent-[var(--primary)] cursor-not-allowed"
            />
          )}
        </td>
      )}
    </tr>
  );
}

