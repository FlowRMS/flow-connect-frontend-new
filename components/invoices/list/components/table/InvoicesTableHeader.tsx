/**
 * InvoicesTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { Invoice } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { invoiceStatusLabels } from '../../constants';
import { formatCurrency } from '../../utils';

interface InvoicesTableHeaderProps {
  // Selection
  filteredInvoices: Invoice[];
  areAllEligibleSelected: boolean;
  isPartiallySelected?: boolean;
  onSelectAll: (checked: boolean) => void;
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
}

export function InvoicesTableHeader({
  filteredInvoices,
  areAllEligibleSelected,
  isPartiallySelected,
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
}: InvoicesTableHeaderProps) {
  return (
    <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
      <tr>
        {/* Checkbox */}
        <th className="w-10 px-3 py-3 text-left">
          <input
            type="checkbox"
            checked={areAllEligibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected ?? false;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
          />
        </th>

        {/* Preview */}
        <th className="w-10 px-3 py-3 text-center"></th>

        {/* Invoice # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Invoice #</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Status */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Status</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Order # */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
          <span className="whitespace-nowrap">Order #</span>
        </th>

        {/* Invoice Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Invoice Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Inv Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <div className="flex items-center justify-end gap-1.5">
            <span className="whitespace-nowrap">Inv Amount</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Comm Amount */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
          <span className="whitespace-nowrap">Comm Amount</span>
        </th>

        {/* Factory */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Factory</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Entry Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <span className="whitespace-nowrap">Entry Date</span>
        </th>

        {/* Created By */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
          <span className="whitespace-nowrap">Created By</span>
        </th>

        {/* Due Date */}
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '130px' }}>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Due Date</span>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </th>

        {/* Paid */}
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px' }}>
          <span className="whitespace-nowrap">Paid</span>
        </th>
      </tr>
    </thead>
  );
}

