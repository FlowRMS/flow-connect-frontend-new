/**
 * LineItemsTable Component
 * Main table component for check line items
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { LineItem, ColumnKey, CheckStatus } from '../../types';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';
import { useLineItemsTabNavigation } from './useLineItemsTabNavigation';
import { SAVED_VIEWS, getDefaultView } from '../../config/viewsConfig';

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
  onZeroAllStatedCommissions?: () => void;
  onOrderClick?: (orderId: string) => void;
  onDelete?: (id: string) => void;
  isPinned?: (colKey: ColumnKey) => boolean;
  getPinnedColumnStyle?: (colKey: ColumnKey, isHeader?: boolean) => React.CSSProperties;
  // Views and columns controls
  activeView?: string;
  showViewsMenu?: boolean;
  onToggleViewsMenu?: () => void;
  onSelectView?: (viewId: string) => void;
  onOpenColumnsModal?: () => void;
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
  onZeroAllStatedCommissions,
  onOrderClick,
  onDelete,
  isPinned = () => false,
  getPinnedColumnStyle = () => ({}),
  activeView,
  showViewsMenu,
  onToggleViewsMenu,
  onSelectView,
  onOpenColumnsModal,
}: LineItemsTableProps) {
  // Sort state - default to entityDate ascending (earliest invoice first)
  const [sortColumn, setSortColumn] = useState<SortableColumnKey>('entityDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Tab navigation hook - 1 editable field per row (paidCommission)
  const { registerInput, handleKeyDown, getTabIndex } = useLineItemsTabNavigation({
    totalItems: lineItems.length,
    editableFieldsPerRow: 1,
    tableContainerSelector: '.line-items-table',
  });

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0 bg-[var(--card)] rounded-t-lg border border-[var(--border)] border-b-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--foreground)]">Line Items</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            {lineItems.length}
          </span>
          {status !== 'posted' && onZeroAllStatedCommissions && lineItems.length > 0 && (
            <label className="flex items-center gap-2 ml-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lineItems.every(item => item.paidCommission === 0)}
                onChange={() => onZeroAllStatedCommissions()}
                className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--muted-foreground)]">Zero all stated commissions</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Default (Views) Button */}
          {onToggleViewsMenu && (
            <div className="relative">
              <button
                onClick={onToggleViewsMenu}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="14" height="14" rx="2" />
                  <path d="M3 8h14M8 8v9" />
                </svg>
                {SAVED_VIEWS.find((v) => v.id === activeView)?.name || getDefaultView().name}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showViewsMenu && onSelectView && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={onToggleViewsMenu}
                  />
                  <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    <div className="p-2 border-b border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">
                        Saved Views
                      </p>
                    </div>
                    {SAVED_VIEWS.map((view) => (
                      <button
                        key={view.id}
                        onClick={() => {
                          if (onSelectView) {
                            onSelectView(view.id);
                            onToggleViewsMenu();
                          }
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                          activeView === view.id
                            ? 'text-[var(--primary)] font-medium'
                            : ''
                        }`}
                      >
                        {view.name}
                        {activeView === view.id && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              d="M5 10l3 3 7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Columns Button */}
          <button
            onClick={onOpenColumnsModal}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="4" height="14" rx="1" />
              <rect x="8" y="3" width="4" height="14" rx="1" />
              <rect x="13" y="3" width="4" height="14" rx="1" />
            </svg>
            Columns
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {visibleColumns.size}
            </span>
          </button>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] flex flex-col h-full rounded-t-none">
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
            status={status}
            showActionsColumn={!!onDelete}
            isPinned={isPinned}
            getPinnedColumnStyle={getPinnedColumnStyle}
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
              sortedLineItems.map((item, index) => (
                <LineItemsTableRow
                  key={item.id}
                  item={item}
                  rowIndex={index}
                  visibleColumns={visibleColumns}
                  status={status}
                  onTogglePaid={onTogglePaid}
                  onRowClick={onRowClick}
                  onUpdateStatedCommission={onUpdateStatedCommission}
                  onOrderClick={onOrderClick}
                  onDelete={onDelete}
                  registerInput={registerInput}
                  onKeyDown={handleKeyDown}
                  getTabIndex={getTabIndex}
                  isPinned={isPinned}
                  getPinnedColumnStyle={getPinnedColumnStyle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

