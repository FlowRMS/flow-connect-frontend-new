/**
 * CommissionsTableSkeleton Component
 * Skeleton loader for the commissions table rows
 */

interface CommissionsTableSkeletonProps {
  rowCount?: number;
}

export function CommissionsTableSkeleton({
  rowCount = 8,
}: CommissionsTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Preview button skeleton */}
          <td className="px-3 py-3 text-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse mx-auto" />
          </td>

          {/* Checkbox skeleton */}
          <td className="px-3 py-3">
            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-200 animate-pulse" />
          </td>

          {/* Check Number skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Status skeleton */}
          <td className="px-3 py-3">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Commission skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Commission Month skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Factory skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Post Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Check Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Entry Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Created By skeleton */}
          <td className="px-3 py-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          </td>

          {/* Check Balance skeleton */}
          <td className="px-3 py-3 text-right">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
