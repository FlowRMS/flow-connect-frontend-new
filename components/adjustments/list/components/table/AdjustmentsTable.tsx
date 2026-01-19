/**
 * AdjustmentsTable Component
 * Main table component with scroll horizontal always visible
 */

import { useRef } from 'react';
import type { AdjustmentLandingPage } from '@/components/orders/api/adjustmentsApi';
import { AdjustmentsTableHeader } from './AdjustmentsTableHeader';
import { AdjustmentRow } from './AdjustmentRow';
import { AdjustmentsTableSkeleton } from './AdjustmentsTableSkeleton';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';

interface AdjustmentsTableProps {
  adjustments: AdjustmentLandingPage[];
  isLoading?: boolean;
  sortField?: 'date' | 'amount' | 'number';
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: 'date' | 'amount' | 'number') => void;
  onView: (adjustment: AdjustmentLandingPage) => void;
  onEdit: (adjustment: AdjustmentLandingPage) => void;
  onDelete: (adjustment: AdjustmentLandingPage) => void;
  // Pagination props for infinite scroll
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  searchQuery?: string;
  // Totals for footer
  totalAmount?: number;
}

export function AdjustmentsTable({
  adjustments,
  isLoading = false,
  sortField,
  sortDirection,
  onSort,
  onView,
  onEdit,
  onDelete,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchQuery = '',
  totalAmount,
}: AdjustmentsTableProps) {
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
      {!isLoading && adjustments.length === 0 ? (
        // Empty state - don't show table structure
        null
      ) : (
        <div 
          ref={scrollContainerRef}
          className="overflow-auto scrollbar-always-visible flex-1"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
            <table className="w-full min-w-[1200px]">
              <AdjustmentsTableHeader
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <tbody className="divide-y divide-[var(--border)]">
                {isLoading ? (
                  <AdjustmentsTableSkeleton rowCount={8} />
                ) : (
                  adjustments.map((adjustment) => (
                    <AdjustmentRow
                      key={adjustment.id}
                      adjustment={adjustment}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </tbody>
              {adjustments.length > 0 && totalAmount !== undefined && (
                <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-sm">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(totalAmount)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
            <span className="text-sm text-[var(--muted-foreground)]">Loading more adjustments...</span>
          </div>
        </div>
      )}
    </div>
  );
}
