/**
 * InvoicesTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import type { Invoice } from '@/lib/types/rms';
import type { SortField, SortDirection, ColumnFilters } from '../../types';
import { isInvoiceLinked, getInvoiceLinkedReason } from '../../utils';
import { InvoicesTableHeader } from './InvoicesTableHeader';
import { InvoiceRow } from './InvoiceRow';
import { InvoicesEmptyState } from './InvoicesEmptyState';

interface InvoicesTableProps {
  // Data
  filteredInvoices: Invoice[];
  // Selection (legacy API)
  selectedInvoiceIds: Set<string>;
  toggleInvoiceSelection: (invoiceId: string) => void;
  selectAllInvoices: (invoices: Invoice[]) => void;
  clearSelection: () => void;
  areAllEligibleSelected: ((invoices: Invoice[]) => boolean) | boolean;
  // Selection (new API for proper select all)
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
  uniqueBalances,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  setSelectedInvoice,
}: InvoicesTableProps) {
  // Compatibility layer: use new API if available, fall back to legacy
  const checkIsSelected = (id: string) =>
    isItemSelected ? isItemSelected(id) : selectedInvoiceIds.has(id);
  const allSelected = isAllSelected !== undefined
    ? isAllSelected
    : (typeof areAllEligibleSelected === 'function' ? areAllEligibleSelected(filteredInvoices) : areAllEligibleSelected);
  const partiallySelected = isPartiallySelected !== undefined
    ? isPartiallySelected
    : (selectedInvoiceIds.size > 0 && !allSelected);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
      {filteredInvoices.length === 0 ? (
        // Empty state - don't show table structure
        <InvoicesEmptyState />
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <div className="overflow-auto scrollbar-always-visible flex-1">
            <table className="w-full min-w-[1640px]">
              <InvoicesTableHeader
                filteredInvoices={filteredInvoices}
                areAllEligibleSelected={allSelected}
                isPartiallySelected={partiallySelected}
                onSelectAll={(checked) => {
                  if (handleSelectAll) {
                    handleSelectAll(checked);
                  } else if (checked) {
                    selectAllInvoices(filteredInvoices);
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
                uniqueBalances={uniqueBalances}
              />
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    isSelected={checkIsSelected(invoice.id)}
                    isLinked={isInvoiceLinked(invoice)}
                    linkedReason={getInvoiceLinkedReason(invoice)}
                    onToggleSelection={() => {
                      if (handleSelectOne) {
                        handleSelectOne(invoice.id, !checkIsSelected(invoice.id));
                      } else {
                        toggleInvoiceSelection(invoice.id);
                      }
                    }}
                    onPreview={() => setSelectedInvoice(invoice)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

