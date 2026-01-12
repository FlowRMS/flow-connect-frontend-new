/**
 * OrdersTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Order } from '@/lib/types/rms';
import { getGridTemplateColumns } from '../../config/columnConfig';
import { isOrderLinked, getOrderLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { OrdersTableHeader } from './OrdersTableHeader';
import { OrderRow } from './OrderRow';
import { OrdersEmptyState } from './OrdersEmptyState';
import { OrdersTableSkeleton } from './OrdersTableSkeleton';

interface OrdersTableProps {
  // Data
  filteredOrders: Order[];
  // Loading state
  isLoading?: boolean;
  // Selection
  selectedOrderIds: Set<string>;
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: (orders: Order[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: (orders: Order[]) => boolean;
  // Bulk actions
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  bulkSetStatus: (status: any) => void;
  bulkDelete: () => void;
  // Selected order for preview
  setSelectedOrder: (order: Order) => void;
}

export function OrdersTable({
  filteredOrders,
  isLoading = false,
  selectedOrderIds,
  toggleOrderSelection,
  selectAllOrders,
  clearSelection,
  areAllEligibleSelected,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  setSelectedOrder,
}: OrdersTableProps) {
  const gridColumns = getGridTemplateColumns();

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrderIds.size}
          showBulkActionsMenu={showBulkActionsMenu}
          setShowBulkActionsMenu={setShowBulkActionsMenu}
          onClearSelection={clearSelection}
          onBulkSetStatus={bulkSetStatus}
          onBulkDelete={bulkDelete}
        />
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[1990px]">
          {/* Table Header */}
          <OrdersTableHeader
            filteredOrders={filteredOrders}
            areAllEligibleSelected={areAllEligibleSelected(filteredOrders)}
            onSelectAll={() => selectAllOrders(filteredOrders)}
            gridColumns={gridColumns}
          />

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <OrdersTableSkeleton gridColumns={gridColumns} />
            ) : filteredOrders.length === 0 ? (
              <OrdersEmptyState />
            ) : (
              filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderIds.has(order.id)}
                  isLinked={isOrderLinked(order)}
                  linkedReason={getOrderLinkedReason(order)}
                  onToggleSelection={() => toggleOrderSelection(order.id)}
                  onPreview={() => setSelectedOrder(order)}
                  gridColumns={gridColumns}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
