/**
 * OrdersTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Order } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { getGridTemplateColumns } from '../../config/columnConfig';
import { isOrderLinked, getOrderLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { OrdersTableHeader } from './OrdersTableHeader';
import { OrderRow } from './OrderRow';
import { OrdersEmptyState } from './OrdersEmptyState';

interface OrdersTableProps {
  // Data
  filteredOrders: Order[];
  // Selection
  selectedOrderIds: Set<string>;
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: (orders: Order[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: (orders: Order[]) => boolean;
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
  // Filters
  columnFilters: ColumnFilters;
  setColumnFilters: (filters: ColumnFilters | ((prev: ColumnFilters) => ColumnFilters)) => void;
  openFilter: string | null;
  setOpenFilter: (filterId: string | null) => void;
  uniqueCustomers: string[];
  uniqueManufacturers: string[];
  uniqueStatuses: string[];
  uniqueTotals: number[];
  uniqueCommissions: number[];
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
  selectedOrderIds,
  toggleOrderSelection,
  selectAllOrders,
  clearSelection,
  areAllEligibleSelected,
  sortField,
  sortDirection,
  handleSort,
  columnFilters,
  setColumnFilters,
  openFilter,
  setOpenFilter,
  uniqueCustomers,
  uniqueManufacturers,
  uniqueStatuses,
  uniqueTotals,
  uniqueCommissions,
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
        <div className="min-w-[1850px]">
          {/* Table Header */}
          <OrdersTableHeader
            filteredOrders={filteredOrders}
            areAllEligibleSelected={areAllEligibleSelected(filteredOrders)}
            onSelectAll={() => selectAllOrders(filteredOrders)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            uniqueCustomers={uniqueCustomers}
            uniqueManufacturers={uniqueManufacturers}
            uniqueStatuses={uniqueStatuses}
            uniqueTotals={uniqueTotals}
            uniqueCommissions={uniqueCommissions}
            gridColumns={gridColumns}
          />

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredOrders.length === 0 ? (
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
