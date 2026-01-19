/**
 * ContactsTableSkeleton Component
 * Skeleton loader for the contacts table rows
 */

interface ContactsTableSkeletonProps {
  rowCount?: number;
}

export function ContactsTableSkeleton({
  rowCount = 8,
}: ContactsTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Name skeleton */}
          <td className="px-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mb-0.5" />
                <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </td>

          {/* Company skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Role skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Tags skeleton */}
          <td className="px-3 py-3">
            <div className="flex items-center gap-1">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </td>

          {/* Created At skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Created By skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}
