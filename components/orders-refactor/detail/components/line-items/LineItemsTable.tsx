/**
 * LineItemsTable Component
 * Main line items table with all columns, rows, and bulk actions
 */

'use client';

import React from 'react';
import type { Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode } from '../../types';
import { BulkActionsBar } from './BulkActionsBar';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';

interface LineItemsTableProps {
  order: Order;
  selectedLineItems: Set<string>;
  onToggleLineItemSelection: (id: string) => void;
  onToggleAllLineItems: () => void;
  onClearSelection: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  isPinned: (column: ColumnKey) => boolean;
  getPinnedColumnStyle: (column: ColumnKey) => React.CSSProperties;
  lineItemAcknowledgements: Record<string, any>;
  lineItemCredits: Record<string, any>;
  // Helper functions
  getLinkedInvoicesForLineItem: (item: any, orderId: string, invoices: any[]) => any[];
  getLinkedChecksForInvoice: (invoiceId: string, checks: any[]) => any[];
  getLineShipStatus: (item: any, invoices: any[]) => { label: string; color: string };
  mockInvoices: any[];
  mockChecks: any[];
  setInvoiceTooltip: React.Dispatch<React.SetStateAction<any>>;
  // Bulk action handlers
  onSetOverage: () => void;
  onLockOverage: () => void;
  onUnlockOverage: () => void;
  onSetEndUser: () => void;
  onSetOutsideRepSplits: () => void;
  onConvertToWarehouse: () => void;
  onAddCredit: () => void;
  onAddAcknowledgement: () => void;
  onDeleteLines: () => void;
}

export function LineItemsTable({
  order,
  selectedLineItems,
  onToggleLineItemSelection,
  onToggleAllLineItems,
  onClearSelection,
  visibleColumns,
  viewMode,
  isPinned,
  getPinnedColumnStyle,
  lineItemAcknowledgements,
  lineItemCredits,
  getLinkedInvoicesForLineItem,
  getLinkedChecksForInvoice,
  getLineShipStatus,
  mockInvoices,
  mockChecks,
  setInvoiceTooltip,
  onSetOverage,
  onLockOverage,
  onUnlockOverage,
  onSetEndUser,
  onSetOutsideRepSplits,
  onConvertToWarehouse,
  onAddCredit,
  onAddAcknowledgement,
  onDeleteLines,
}: LineItemsTableProps) {
  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onSetOverage={onSetOverage}
          onLockOverage={onLockOverage}
          onUnlockOverage={onUnlockOverage}
          onSetEndUser={onSetEndUser}
          onSetOutsideRepSplits={onSetOutsideRepSplits}
          onConvertToWarehouse={onConvertToWarehouse}
          onAddCredit={onAddCredit}
          onAddAcknowledgement={onAddAcknowledgement}
          onDeleteLines={onDeleteLines}
        />
      )}

      {/* Line Items Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <LineItemsTableHeader
            lineItems={order.lineItems}
            selectedLineItems={selectedLineItems}
            onToggleAllLineItems={onToggleAllLineItems}
            visibleColumns={visibleColumns}
            viewMode={viewMode}
            isPinned={isPinned}
            getPinnedColumnStyle={getPinnedColumnStyle}
          />
          <tbody>
            {order.lineItems.map(item => (
              <LineItemsTableRow
                key={item.id}
                item={item}
                order={order}
                isSelected={selectedLineItems.has(item.id)}
                onToggleSelection={onToggleLineItemSelection}
                visibleColumns={visibleColumns}
                viewMode={viewMode}
                isPinned={isPinned}
                getPinnedColumnStyle={getPinnedColumnStyle}
                lineItemAcknowledgements={lineItemAcknowledgements}
                lineItemCredits={lineItemCredits}
                getLinkedInvoicesForLineItem={getLinkedInvoicesForLineItem}
                getLinkedChecksForInvoice={getLinkedChecksForInvoice}
                getLineShipStatus={getLineShipStatus}
                mockInvoices={mockInvoices}
                mockChecks={mockChecks}
                setInvoiceTooltip={setInvoiceTooltip}
              />
            ))}
          </tbody>
        </table>

        {/* Add Line Button */}
        <div className="border-t border-[var(--border)]">
          <button className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Line
          </button>
        </div>
      </div>
    </div>
  );
}
