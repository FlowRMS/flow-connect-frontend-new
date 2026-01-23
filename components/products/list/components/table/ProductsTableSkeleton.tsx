/**
 * ProductsTableSkeleton Component
 * Skeleton loader for the products table rows
 */

interface ProductsTableSkeletonProps {
  rowCount?: number;
}

export function ProductsTableSkeleton({
  rowCount = 8,
}: ProductsTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Checkbox skeleton */}
          <td className="px-4 py-3">
            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-200 animate-pulse" />
          </td>

          {/* Part Number skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Description skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Factory skeleton */}
          <td className="px-4 py-3">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          </td>

          {/* Category skeleton */}
          <td className="px-4 py-3">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          </td>

          {/* UOM skeleton */}
          <td className="px-4 py-3">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Unit Price skeleton */}
          <td className="px-4 py-3 text-right">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>

          {/* Commission Rate skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
          </td>

          {/* Published Status skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
          </td>

          {/* Approval Needed skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
          </td>

          {/* Actions skeleton */}
          <td className="px-4 py-3 text-center">
            <div className="w-6 h-6 rounded bg-gray-200 animate-pulse mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
