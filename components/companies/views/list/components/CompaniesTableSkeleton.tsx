/**
 * CompaniesTableSkeleton Component
 * Skeleton loader for the companies table rows
 */

interface CompaniesTableSkeletonProps {
  rowCount?: number;
}

export function CompaniesTableSkeleton({
  rowCount = 8,
}: CompaniesTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Company Name skeleton */}
          <td className="px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[var(--muted)] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </td>

          {/* Type skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-5 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Phone skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Website skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-4 w-28 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Tags skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Created By skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Created skeleton */}
          <td className="px-2 md:px-3 py-3 md:py-4">
            <div className="h-3 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

