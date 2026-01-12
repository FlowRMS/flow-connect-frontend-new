/**
 * OrdersTableSkeleton Component
 * Skeleton loader for the orders table rows
 */

interface OrdersTableSkeletonProps {
  gridColumns: string;
  rowCount?: number;
}

export function OrdersTableSkeleton({
  gridColumns,
  rowCount = 8,
}: OrdersTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <div
          key={index}
          className="grid gap-2 px-4 py-3"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {/* Checkbox skeleton */}
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--muted)] animate-pulse" />
          </div>

          {/* Preview button skeleton */}
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[var(--muted)] animate-pulse" />
          </div>

          {/* Order Number skeleton */}
          <div className="flex items-center">
            <div className="h-4 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Commission skeleton */}
          <div className="flex items-center justify-end">
            <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Status skeleton */}
          <div className="flex items-center">
            <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Amount skeleton */}
          <div className="flex items-center justify-end">
            <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Order Date skeleton */}
          <div className="flex items-center">
            <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Entry Date skeleton */}
          <div className="flex items-center">
            <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Created By skeleton */}
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-[var(--muted)] animate-pulse" />
          </div>

          {/* Ship Date skeleton */}
          <div className="flex items-center">
            <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Due Date skeleton */}
          <div className="flex items-center">
            <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Factory skeleton */}
          <div className="flex items-center">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Customer skeleton */}
          <div className="flex items-center">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Job Name skeleton */}
          <div className="flex items-center">
            <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          {/* Visible skeleton */}
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 rounded bg-[var(--muted)] animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

