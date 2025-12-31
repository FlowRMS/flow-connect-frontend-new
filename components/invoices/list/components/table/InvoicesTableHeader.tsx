/**
 * InvoicesTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { Invoice } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { SortIcon } from './SortIcon';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { invoiceStatusLabels } from '../../constants';
import { formatCurrency } from '../../utils';

interface InvoicesTableHeaderProps {
  // Selection
  filteredInvoices: Invoice[];
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
  uniqueBalances: number[];
  // Grid columns
  gridColumns: string;
}

export function InvoicesTableHeader({
  filteredInvoices,
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
  uniqueBalances,
  gridColumns,
}: InvoicesTableHeaderProps) {
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

      {/* Invoice # */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('invoiceNumber')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Invoice #
          <SortIcon
            field="invoiceNumber"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="text"
          filterId="invoiceNumber"
          value={columnFilters.invoiceNumber}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, invoiceNumber: value }))
          }
          placeholder="Search invoices..."
          isOpen={openFilter === 'invoiceNumber'}
          onToggle={() =>
            setOpenFilter(openFilter === 'invoiceNumber' ? null : 'invoiceNumber')
          }
        />
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
            label: invoiceStatusLabels[s as keyof typeof invoiceStatusLabels],
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

      {/* Order # */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Order #
        </span>
      </div>

      {/* Invoice Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('invoiceDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Invoice Date
          <SortIcon
            field="invoiceDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="invoiceDate"
          value={columnFilters.invoiceDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, invoiceDate: value }))
          }
          isOpen={openFilter === 'invoiceDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'invoiceDate' ? null : 'invoiceDate')
          }
        />
      </div>

      {/* Inv Amount */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => onSort('total')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Inv Amount
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
          onToggle={() =>
            setOpenFilter(openFilter === 'total' ? null : 'total')
          }
        />
      </div>

      {/* Comm Amount */}
      <div className="flex items-center justify-end">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Comm Amount
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
          options={uniqueManufacturers.map((m) => ({
            value: m,
            label: m,
          }))}
          value={columnFilters.manufacturerName}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, manufacturerName: value }))
          }
          placeholder="All Factories"
          isOpen={openFilter === 'manufacturerName'}
          onToggle={() =>
            setOpenFilter(openFilter === 'manufacturerName' ? null : 'manufacturerName')
          }
        />
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Entry Date
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <button
          onClick={() => onSort('dueDate')}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
        >
          Due Date
          <SortIcon
            field="dueDate"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
          />
        </button>
        <ColumnFilterDropdown
          type="daterange"
          filterId="dueDate"
          value={columnFilters.dueDate}
          onChange={(value) =>
            setColumnFilters((prev) => ({ ...prev, dueDate: value }))
          }
          isOpen={openFilter === 'dueDate'}
          onToggle={() =>
            setOpenFilter(openFilter === 'dueDate' ? null : 'dueDate')
          }
        />
      </div>

      {/* Paid */}
      <div className="flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Paid
        </span>
      </div>
    </div>
  );
}

