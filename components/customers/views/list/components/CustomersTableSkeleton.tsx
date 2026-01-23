/**
 * CustomersTableSkeleton Component
 * Skeleton loader for the customers table rows
 */

interface CustomersTableSkeletonProps {
  rowCount?: number;
}

export function CustomersTableSkeleton({
  rowCount = 8,
}: CustomersTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Checkbox skeleton */}
          <td className="px-4 py-3">
            <div className="w-4 h-4 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Company Name skeleton */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--muted)] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </td>

          {/* Inside Reps skeleton */}
          <td className="px-4 py-3">
            <div className="h-6 w-16 bg-[var(--muted)] rounded-full animate-pulse" />
          </td>

          {/* Outside Reps skeleton */}
          <td className="px-4 py-3">
            <div className="h-6 w-16 bg-[var(--muted)] rounded-full animate-pulse" />
          </td>

          {/* Type skeleton */}
          <td className="px-4 py-3">
            <div className="h-6 w-20 bg-[var(--muted)] rounded-full animate-pulse" />
          </td>

          {/* Parent skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Status skeleton */}
          <td className="px-4 py-3">
            <div className="h-6 w-20 bg-[var(--muted)] rounded-full animate-pulse" />
          </td>

          {/* Created skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </td>

          {/* Actions skeleton */}
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <div className="w-8 h-8 rounded bg-[var(--muted)] animate-pulse" />
              <div className="w-8 h-8 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
