/**
 * ContactsEmptyState Component
 * Displayed when no contacts match the current filters
 */

interface ContactsEmptyStateProps {
  hasFilters?: boolean;
}

export function ContactsEmptyState({ hasFilters = false }: ContactsEmptyStateProps) {
  return (
    <div className="py-8 text-center">
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
              No data found for the applied filters
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Try adjusting your filters to see more results
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          No contacts found
        </p>
      )}
    </div>
  );
}
