/**
 * InvoicesEmptyState Component
 * Displayed when no invoices match the current filters
 */

interface InvoicesEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function InvoicesEmptyState({ hasFilters = false, onClearFilters }: InvoicesEmptyStateProps) {
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
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M8 12h8M8 16h4"/>
          <circle cx="16" cy="16" r="2"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No invoices match your filters
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Try adjusting or clearing your filters to see more invoices.
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
            No invoices yet
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md">
            Create your first invoice to get started.
          </p>
        </>
      )}
    </div>
  );
}
