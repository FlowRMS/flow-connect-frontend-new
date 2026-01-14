/**
 * OrdersTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Order } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { getGridTemplateColumns } from '../../config/columnConfig';
import { isOrderLinked, getOrderLinkedReason } from '../../utils';
import { OrdersTableHeader } from './OrdersTableHeader';
import { OrderRow } from './OrderRow';
import { OrdersEmptyState } from './OrdersEmptyState';

interface OrdersTableProps {
  // Data
  filteredOrders: Order[];
  // Selection (legacy API - for backwards compatibility)
  selectedOrderIds: Set<string>;
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: (orders: Order[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: ((orders: Order[]) => boolean) | boolean;
  // Selection (new shared hook API)
  isItemSelected?: (id: string) => boolean;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  handleSelectAll?: (checked: boolean) => void;
  handleSelectOne?: (id: string, checked: boolean) => void;
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
  isItemSelected,
  isAllSelected,
  isPartiallySelected,
  handleSelectAll,
  handleSelectOne,
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

  // Use new API if available, otherwise fall back to legacy
  const checkIsSelected = (id: string) => isItemSelected ? isItemSelected(id) : selectedOrderIds.has(id);
  const allSelected = isAllSelected !== undefined ? isAllSelected : (typeof areAllEligibleSelected === 'function' ? areAllEligibleSelected(filteredOrders) : areAllEligibleSelected);
  const partiallySelected = isPartiallySelected !== undefined ? isPartiallySelected : (selectedOrderIds.size > 0 && !allSelected);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1990px]">
          {/* Table Header */}
          <OrdersTableHeader
            filteredOrders={filteredOrders}
            areAllEligibleSelected={allSelected}
            isPartiallySelected={partiallySelected}
            onSelectAll={(checked) => {
              if (handleSelectAll) {
                handleSelectAll(checked);
              } else if (checked) {
                selectAllOrders(filteredOrders);
              } else {
                clearSelection();
              }
            }}
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
                  isSelected={checkIsSelected(order.id)}
                  isLinked={isOrderLinked(order)}
                  linkedReason={getOrderLinkedReason(order)}
                  onToggleSelection={() => {
                    if (handleSelectOne) {
                      handleSelectOne(order.id, !checkIsSelected(order.id));
                    } else {
                      toggleOrderSelection(order.id);
                    }
                  }}
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
