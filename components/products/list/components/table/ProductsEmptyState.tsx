/**
 * ProductsEmptyState Component
 * Displayed when no products match the current filters
 */

interface ProductsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateProduct?: () => void;
}

export function ProductsEmptyState({ 
  hasFilters = false,
  onClearFilters,
  onCreateProduct,
}: ProductsEmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {hasFilters ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-[var(--muted)]/30 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">
              No products found for the applied filters
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Try adjusting your filters to see more results
            </p>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--muted)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No products found</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Get started by creating your first product
            </p>
            {onCreateProduct && (
              <button
                onClick={onCreateProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Create First Product
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
