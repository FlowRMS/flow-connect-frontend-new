/**
 * InvoicesTableSkeleton Component
 * Skeleton loader for the invoices table rows
 */

interface InvoicesTableSkeletonProps {
  rowCount?: number;
}

export function InvoicesTableSkeleton({
  rowCount = 8,
}: InvoicesTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index}>
          {/* Checkbox skeleton */}
          <td className="px-3 py-3">
            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-200 animate-pulse" />
          </td>

          {/* Preview button skeleton */}
          <td className="px-3 py-3 text-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse mx-auto" />
          </td>

          {/* Invoice Number skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Status skeleton */}
          <td className="px-3 py-3">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Order Number skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Invoice Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Inv Amount skeleton */}
          <td className="px-3 py-3 text-right">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>

          {/* Comm Amount skeleton */}
          <td className="px-3 py-3 text-right">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>

          {/* Factory skeleton */}
          <td className="px-3 py-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Entry Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Created By skeleton */}
          <td className="px-3 py-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          </td>

          {/* Due Date skeleton */}
          <td className="px-3 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </td>

          {/* Paid skeleton */}
          <td className="px-3 py-3 text-center">
            <div className="w-5 h-5 rounded bg-gray-200 animate-pulse mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
