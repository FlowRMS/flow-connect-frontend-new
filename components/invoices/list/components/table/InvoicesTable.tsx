/**
 * InvoicesTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import { useRef } from 'react';
import type { Invoice } from '@/lib/types/rms';
import { isInvoiceLinked, getInvoiceLinkedReason } from '../../utils';
import { InvoicesTableHeader } from './InvoicesTableHeader';
import { InvoiceRow } from './InvoiceRow';
import { InvoicesEmptyState } from './InvoicesEmptyState';
import { InvoicesTableSkeleton } from './InvoicesTableSkeleton';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getInvoiceFilterOptions } from '../../config/filterConfig';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';

interface InvoicesTableProps {
  // Data
  filteredInvoices: Invoice[];
  // Loading state
  isLoading?: boolean;
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
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getInvoiceFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Bulk actions
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  bulkSetStatus: (status: any) => void;
  bulkDelete: () => void;
  // Selected invoice for preview
  setSelectedInvoice: (invoice: Invoice) => void;
  // Pagination props for infinite scroll
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  searchQuery?: string;
}

export function InvoicesTable({
  filteredInvoices,
  isLoading = false,
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
  onColumnFiltersChange,
  filterOptions = getInvoiceFilterOptions(),
  columnFilters,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  bulkSetStatus,
  bulkDelete,
  setSelectedInvoice,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchQuery = '',
}: InvoicesTableProps) {
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use scroll pagination hook to detect when scrolling near bottom of table
  // Only enable pagination when not searching (search results are handled differently)
  const shouldPaginate = (hasNextPage ?? false) && !searchQuery;
  useScrollPagination(scrollContainerRef, {
    hasNextPage: shouldPaginate,
    isFetchingNextPage: isFetchingNextPage ?? false,
    fetchNextPage: fetchNextPage ?? (() => {}),
    threshold: 200, // Trigger when within 200px of bottom
  });

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
      {!isLoading && filteredInvoices.length === 0 ? (
        // Empty state - don't show table structure
        null
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div 
            ref={scrollContainerRef}
            className="overflow-auto scrollbar-always-visible flex-1"
          >
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
                onColumnFiltersChange={onColumnFiltersChange}
                filterOptions={filterOptions}
                columnFilters={columnFilters}
              />
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <InvoicesTableSkeleton rowCount={8} />
                ) : (
                  filteredInvoices.map((invoice) => (
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

