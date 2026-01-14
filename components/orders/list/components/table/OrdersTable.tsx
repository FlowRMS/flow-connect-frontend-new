/**
 * OrdersTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Order } from '@/lib/types/rms';
import { isOrderLinked, getOrderLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { OrdersTableHeader } from './OrdersTableHeader';
import { OrderRow } from './OrderRow';
import { OrdersEmptyState } from './OrdersEmptyState';
import { OrdersTableSkeleton } from './OrdersTableSkeleton';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getOrderFilterOptions } from '../../config/filterConfig';

interface OrdersTableProps {
  // Data
  filteredOrders: Order[];
  // Loading state
  isLoading?: boolean;
  // Filters state
  hasFilters?: boolean;
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
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getOrderFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
}

export function OrdersTable({
  filteredOrders,
  isLoading = false,
  hasFilters = false,
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
  onColumnFiltersChange,
  filterOptions,
  columnFilters,
}: OrdersTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
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

      {!isLoading && filteredOrders.length === 0 ? (
        // Empty state - don't show table structure
        null
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <div className="overflow-auto scrollbar-always-visible flex-1">
            <table className="w-full min-w-[1800px]">
              <OrdersTableHeader
                filteredOrders={filteredOrders}
                areAllEligibleSelected={areAllEligibleSelected(filteredOrders)}
                onSelectAll={() => selectAllOrders(filteredOrders)}
                onColumnFiltersChange={onColumnFiltersChange}
                filterOptions={filterOptions}
                columnFilters={columnFilters}
              />
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <OrdersTableSkeleton rowCount={8} />
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
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
