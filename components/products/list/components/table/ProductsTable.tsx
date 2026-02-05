/**
 * ProductsTable Component
 * Main table component that assembles header, rows, bulk actions, etc.
 */

import { useRef } from 'react';
import type { ProductLandingPage } from '../../../api';
import { ProductsTableHeader } from './ProductsTableHeader';
import { ProductRow } from './ProductRow';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsTableSkeleton } from './ProductsTableSkeleton';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getProductFilterOptions } from '../../../config/filterConfig';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';

interface ProductsTableProps {
  // Data
  filteredProducts: ProductLandingPage[];
  // Loading state
  isLoading?: boolean;
  // Filters state
  hasFilters?: boolean;
  // Selection
  isItemSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  handleSelectAll: (checked: boolean) => void;
  handleSelectOne: (id: string, checked: boolean) => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getProductFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Pagination props for infinite scroll
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  searchQuery?: string;
  // Product actions
  onProductClick: (product: ProductLandingPage) => void;
  onDelete: (productId: string) => void;
  // Empty state actions
  onClearFilters?: () => void;
  onCreateProduct?: () => void;
  // Sorting
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

export function ProductsTable({
  filteredProducts,
  isLoading = false,
  hasFilters = false,
  isItemSelected,
  isAllSelected,
  isPartiallySelected,
  handleSelectAll,
  handleSelectOne,
  onColumnFiltersChange,
  filterOptions,
  columnFilters,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchQuery = '',
  onProductClick,
  onDelete,
  onClearFilters,
  onCreateProduct,
  activeSort,
  onSortChange,
  isFetching = false,
}: ProductsTableProps) {
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

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col h-full min-h-[300px] max-h-[calc(100vh-320px)]">
      {!isLoading && filteredProducts.length === 0 ? (
        // Empty state - show empty state component
        <ProductsEmptyState
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          onCreateProduct={onCreateProduct}
        />
      ) : (
        <div className="flex flex-col h-full">
          <div 
            ref={scrollContainerRef}
            className="overflow-auto scrollbar-always-visible flex-1"
          >
            <table className="w-full min-w-[1400px]">
              {/* Header always visible, even when loading */}
              <ProductsTableHeader
                filteredProducts={filteredProducts}
                areAllEligibleSelected={isAllSelected}
                isPartiallySelected={isPartiallySelected}
                onSelectAll={handleSelectAll}
                onColumnFiltersChange={onColumnFiltersChange}
                filterOptions={filterOptions}
                columnFilters={columnFilters}
                activeSort={activeSort}
                onSortChange={onSortChange}
                isFetching={isFetching}
              />
              <tbody className="divide-y divide-[var(--border)]">
                {/* Skeleton only shows when loading AND there are no products (filter applied) */}
                {isLoading && filteredProducts.length === 0 ? (
                  <ProductsTableSkeleton rowCount={8} />
                ) : (
                  <>
                    {filteredProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        isSelected={isItemSelected(product.id)}
                        onToggleSelection={(checked) => handleSelectOne(product.id, checked)}
                        onProductClick={onProductClick}
                        onDelete={onDelete}
                      />
                    ))}
                    {/* Loading indicator for infinite scroll - only shows when fetching more */}
                    {isFetchingNextPage && filteredProducts.length > 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary)]" />
                            <span className="text-sm text-[var(--muted-foreground)]">Loading more products...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
