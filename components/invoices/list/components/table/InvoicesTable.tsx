/**
 * InvoicesTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Invoice } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { getGridTemplateColumns } from '../../config/columnConfig';
import { isInvoiceLinked, getInvoiceLinkedReason } from '../../utils';
import { BulkActionsBar } from './BulkActionsBar';
import { InvoicesTableHeader } from './InvoicesTableHeader';
import { InvoiceRow } from './InvoiceRow';
import { InvoicesEmptyState } from './InvoicesEmptyState';

interface InvoicesTableProps {
  // Data
  filteredInvoices: Invoice[];
  // Selection
  selectedInvoiceIds: Set<string>;
  toggleInvoiceSelection: (invoiceId: string) => void;
  selectAllInvoices: (invoices: Invoice[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: (invoices: Invoice[]) => boolean;
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
  uniqueBalances: number[];
  // Bulk actions
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  bulkSetStatus: (status: any) => void;
  bulkDelete: () => void;
  // Selected invoice for preview
  setSelectedInvoice: (invoice: Invoice) => void;
}

export function InvoicesTable({
  filteredInvoices,
  selectedInvoiceIds,
  toggleInvoiceSelection,
  selectAllInvoices,
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
  uniqueBalances,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  setSelectedInvoice,
}: InvoicesTableProps) {
  const gridColumns = getGridTemplateColumns();

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedInvoiceIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedInvoiceIds.size}
          showBulkActionsMenu={showBulkActionsMenu}
          setShowBulkActionsMenu={setShowBulkActionsMenu}
          onClearSelection={clearSelection}
          onBulkSetStatus={bulkSetStatus}
          onBulkDelete={bulkDelete}
        />
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[1640px]">
          {/* Table Header */}
          <InvoicesTableHeader
            filteredInvoices={filteredInvoices}
            areAllEligibleSelected={areAllEligibleSelected(filteredInvoices)}
            onSelectAll={() => selectAllInvoices(filteredInvoices)}
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
            uniqueBalances={uniqueBalances}
            gridColumns={gridColumns}
          />

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredInvoices.length === 0 ? (
              <InvoicesEmptyState />
            ) : (
              filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  isSelected={selectedInvoiceIds.has(invoice.id)}
                  isLinked={isInvoiceLinked(invoice)}
                  linkedReason={getInvoiceLinkedReason(invoice)}
                  onToggleSelection={() => toggleInvoiceSelection(invoice.id)}
                  onPreview={() => setSelectedInvoice(invoice)}
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

