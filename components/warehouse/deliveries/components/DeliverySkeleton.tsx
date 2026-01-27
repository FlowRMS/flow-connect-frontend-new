import React from 'react';

interface DeliverySkeletonProps {
  count?: number;
  type?: 'table' | 'card';
}

/**
 * Loading skeleton for deliveries
 * Shows while data is being fetched
 */
export const DeliverySkeleton = React.memo<DeliverySkeletonProps>(({ count = 5, type = 'table' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-5 bg-[var(--muted)] rounded w-24 mb-2" />
                <div className="h-4 bg-[var(--muted)] rounded w-32" />
              </div>
              <div className="w-8 h-8 bg-[var(--muted)] rounded" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-[var(--muted)] rounded w-16" />
                <div className="h-5 bg-[var(--muted)] rounded-full w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-[var(--muted)] rounded w-12" />
                <div className="h-3 bg-[var(--muted)] rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table skeleton
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--muted)]/20">
          <tr>
            {['PO Number', 'Vendor', 'Status', 'ETA', 'Tracking', 'Actions'].map((header) => (
              <th key={header} className="px-4 py-3 text-left">
                <div className="h-4 bg-[var(--muted)] rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i} className="border-t border-[var(--border)] animate-pulse">
              <td className="px-4 py-3">
                <div className="h-4 bg-[var(--muted)] rounded w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-[var(--muted)] rounded w-32" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 bg-[var(--muted)] rounded-full w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-[var(--muted)] rounded w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-[var(--muted)] rounded w-28" />
              </td>
              <td className="px-4 py-3">
                <div className="h-8 bg-[var(--muted)] rounded w-8" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

DeliverySkeleton.displayName = 'DeliverySkeleton';

export default DeliverySkeleton;
