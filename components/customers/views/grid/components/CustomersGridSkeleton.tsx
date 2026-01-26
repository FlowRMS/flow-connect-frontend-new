/**
 * CustomersGridSkeleton Component
 * Skeleton loader for the customers grid cards
 */

interface CustomersGridSkeletonProps {
  cardCount?: number;
}

export function CustomersGridSkeleton({ cardCount = 12 }: CustomersGridSkeletonProps) {
  const items = Array.from({ length: cardCount });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((_, index) => (
        <div
          key={index}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 animate-pulse"
        >
          {/* Header: checkbox + avatar + name/type */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-4 h-4 rounded bg-[var(--muted)]" />
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex-shrink-0 mt-1" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="h-4 w-32 bg-[var(--muted)] rounded" />
                <div className="h-5 w-20 bg-[var(--muted)] rounded" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-[var(--muted)]" />
              <div className="w-6 h-6 rounded bg-[var(--muted)]" />
            </div>
          </div>

          {/* Footer: status + date */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <div className="h-6 w-20 bg-[var(--muted)] rounded-full" />
            <div className="h-3 w-16 bg-[var(--muted)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
