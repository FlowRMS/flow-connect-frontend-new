/**
 * AdjustmentsTableSkeleton Component
 * Skeleton loader for the adjustments table rows
 */

interface AdjustmentsTableSkeletonProps {
  rowCount?: number;
}

export function AdjustmentsTableSkeleton({
  rowCount = 8,
}: AdjustmentsTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Adjustment Number skeleton */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </td>

          {/* Date skeleton */}
          <td className="px-4 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Reason skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Amount skeleton */}
          <td className="px-4 py-3 text-right">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>

          {/* Status skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
          </td>

          {/* Locked skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="w-5 h-5 rounded bg-gray-200 animate-pulse mx-auto" />
          </td>

          {/* Created By skeleton */}
          <td className="px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          </td>

          {/* Actions skeleton */}
          <td className="px-4 py-3">
            <div className="flex items-center justify-center gap-1">
              <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
              <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
              <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
