/**
 * OrdersTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { Order } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { SortIcon } from './SortIcon';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { orderStatusLabels } from '../../constants';
import { formatCurrency } from '../../utils';

interface OrdersTableHeaderProps {
  // Selection
  filteredOrders: Order[];
  areAllEligibleSelected: boolean;
  onSelectAll: () => void;
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  // Filters
  columnFilters: ColumnFilters;
  setColumnFilters: (filters: ColumnFilters | ((prev: ColumnFilters) => ColumnFilters)) => void;
  openFilter: string | null;
  setOpenFilter: (filterId: string | null) => void;
  // Unique values for dropdowns
  uniqueCustomers: string[];
  uniqueManufacturers: string[];
  uniqueStatuses: string[];
  uniqueTotals: number[];
  uniqueCommissions: number[];
  // Grid columns
  gridColumns: string;
}

export function OrdersTableHeader({
  filteredOrders,
  areAllEligibleSelected,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  columnFilters,
  setColumnFilters,
  openFilter,
  setOpenFilter,
  uniqueCustomers,
  uniqueManufacturers,
  uniqueStatuses,
  uniqueTotals,
  uniqueCommissions,
  gridColumns,
}: OrdersTableHeaderProps) {
  return (
    <div
      className="grid gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 sticky top-0"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Checkbox column */}
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={areAllEligibleSelected}
          onChange={onSelectAll}
          className="w-4 h-4 accent-[var(--primary)]"
        />
      </div>

      {/* Preview column header - empty */}
      <div className="flex items-center justify-center" />

      {/* Order # */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('orderNumber')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Order #
          <SortIcon
            field="orderNumber"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="text"
          filterId="orderNumber"
          value={columnFilters.orderNumber}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, orderNumber: value }))
          }
          placeholder="Search orders..."
          isOpen={openFilter === 'orderNumber'}
          onToggle={() =>
            setOpenFilter(openFilter === 'orderNumber' ? null : 'orderNumber')
          }
        />
      </div>

      {/* Factory SO */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Factory SO
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('status')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Status
          <SortIcon
            field="status"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="status"
          options={uniqueStatuses.map((s) => ({
            value: s,
            label: orderStatusLabels[s as keyof typeof orderStatusLabels],
          }))}
          value={columnFilters.status}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, status: value }))
          }
          placeholder="All Statuses"
          isOpen={openFilter === 'status'}
          onToggle={() =>
            setOpenFilter(openFilter === 'status' ? null : 'status')
          }
        />
      </div>

      {/* Amount */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => onSort('total')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Amount
          <SortIcon
            field="total"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="total"
          options={uniqueTotals.map((t) => ({
            value: t.toString(),
            label: formatCurrency(t),
          }))}
          value={columnFilters.total}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, total: value }))
          }
          placeholder="All Totals"
          isOpen={openFilter === 'total'}
          onToggle={() => setOpenFilter(openFilter === 'total' ? null : 'total')}
        />
      </div>

      {/* Order Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('orderDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Order Date
          <SortIcon
            field="orderDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="orderDate"
          value={columnFilters.orderDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, orderDate: value }))
          }
          isOpen={openFilter === 'orderDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'orderDate' ? null : 'orderDate')
          }
        />
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Entry Date
        </span>
      </div>

      {/* Ship Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Ship Date
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Due Date
        </span>
      </div>

      {/* Factory */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('manufacturerName')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Factory
          <SortIcon
            field="manufacturerName"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="manufacturerName"
          options={uniqueManufacturers.map((m) => ({ value: m, label: m }))}
          value={columnFilters.manufacturerName}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, manufacturerName: value }))
          }
          placeholder="All Factories"
          isOpen={openFilter === 'manufacturerName'}
          onToggle={() =>
            setOpenFilter(
              openFilter === 'manufacturerName' ? null : 'manufacturerName'
            )
          }
        />
      </div>

      {/* Customer */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('customerName')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Customer
          <SortIcon
            field="customerName"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="customerName"
          options={uniqueCustomers.map((c) => ({ value: c, label: c }))}
          value={columnFilters.customerName}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, customerName: value }))
          }
          placeholder="All Customers"
          isOpen={openFilter === 'customerName'}
          onToggle={() =>
            setOpenFilter(openFilter === 'customerName' ? null : 'customerName')
          }
        />
      </div>

      {/* Commission */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => onSort('totalCommission')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Commission
          <SortIcon
            field="totalCommission"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="multiselect"
          filterId="totalCommission"
          options={uniqueCommissions.map((c) => ({
            value: c.toString(),
            label: formatCurrency(c),
          }))}
          value={columnFilters.totalCommission}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, totalCommission: value }))
          }
          placeholder="All Commissions"
          isOpen={openFilter === 'totalCommission'}
          onToggle={() =>
            setOpenFilter(
              openFilter === 'totalCommission' ? null : 'totalCommission'
            )
          }
        />
      </div>

      {/* Job Name */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Job Name
        </span>
      </div>

      {/* Visible */}
      <div className="flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Visible
        </span>
      </div>
    </div>
  );
}
