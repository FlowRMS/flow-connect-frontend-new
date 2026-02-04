/**
 * OrdersEmptyState Component
 * Displayed when no orders match the current filters
 */

interface OrdersEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function OrdersEmptyState({ hasFilters = false, onClearFilters }: OrdersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No orders match your filters
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Try adjusting or clearing your filters to see more orders.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-red-500 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clear filters
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No orders yet
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md">
            Create your first order to get started.
          </p>
        </>
      )}
    </div>
  );
}
