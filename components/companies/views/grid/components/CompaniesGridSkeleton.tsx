/**
 * CompaniesGridSkeleton Component
 * Skeleton loader for the companies grid cards
 */

interface CompaniesGridSkeletonProps {
  cardCount?: number;
}

export function CompaniesGridSkeleton({ cardCount = 9 }: CompaniesGridSkeletonProps) {
  const items = Array.from({ length: cardCount });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {items.map((_, index) => (
        <div
          key={index}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3 md:p-5 animate-pulse"
        >
          {/* Header: avatar + name/type */}
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[var(--muted)] flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="h-4 w-32 bg-[var(--muted)] rounded" />
                <div className="h-4 w-20 bg-[var(--muted)] rounded" />
              </div>
            </div>
          </div>

          {/* Website / phone rows */}
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-[14px] md:h-[14px] rounded-full bg-[var(--muted)]" />
              <div className="h-3 w-32 bg-[var(--muted)] rounded" />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-[14px] md:h-[14px] rounded-full bg-[var(--muted)]" />
              <div className="h-3 w-24 bg-[var(--muted)] rounded" />
            </div>
          </div>

          {/* Tags row */}
          <div className="flex gap-1 md:gap-1.5 flex-wrap mt-3 md:mt-4">
            <div className="h-5 w-16 bg-[var(--muted)] rounded" />
            <div className="h-5 w-16 bg-[var(--muted)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
