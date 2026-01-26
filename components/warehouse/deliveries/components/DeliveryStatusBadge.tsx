import React from 'react';
import type { ShipmentStatus } from '@/lib/types/warehouse';

interface DeliveryStatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<ShipmentStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-200' },
  PENDING: { label: 'Pending', color: 'text-blue-700', bgColor: 'bg-blue-200' },
  CONFIRMED: { label: 'Confirmed', color: 'text-indigo-700', bgColor: 'bg-indigo-200' },
  ARRIVED: { label: 'Arrived', color: 'text-purple-700', bgColor: 'bg-purple-200' },
  RECEIVING: { label: 'Receiving', color: 'text-yellow-700', bgColor: 'bg-yellow-200' },
  RECEIVED: { label: 'Received', color: 'text-green-700', bgColor: 'bg-green-200' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-200' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Reusable status badge component with consistent styling
 * Memoized for performance
 */
export const DeliveryStatusBadge = React.memo<DeliveryStatusBadgeProps>(
  ({ status, size = 'md', showIcon = false }) => {
    const config = statusConfig[status] || statusConfig.DRAFT;
    const sizeClass = sizeClasses[size];

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClass}`}
      >
        {showIcon && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {status === 'RECEIVED' && <path d="M20 6L9 17l-5-5" />}
            {status === 'RECEIVING' && (
              <>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </>
            )}
            {(status === 'PENDING' || status === 'CONFIRMED') && <circle cx="12" cy="12" r="10" />}
            {status === 'CANCELLED' && (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            )}
          </svg>
        )}
        {config.label}
      </span>
    );
  }
);

DeliveryStatusBadge.displayName = 'DeliveryStatusBadge';

export default DeliveryStatusBadge;
