/**
 * PreOpportunitiesEmptyState Component
 * Displayed when no pre-opportunities match the current filters
 */

interface PreOpportunitiesEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function PreOpportunitiesEmptyState({ hasFilters = false, onClearFilters }: PreOpportunitiesEmptyStateProps) {
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
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No pre-opportunities match your filters
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Try adjusting or clearing your filters to see more pre-opportunities.
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
            No pre-opportunities yet
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md">
            Create your first pre-opportunity to get started.
          </p>
        </>
      )}
    </div>
  );
}
